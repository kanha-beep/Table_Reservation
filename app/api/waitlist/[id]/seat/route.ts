import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!requireRole(request, ["STAFF", "MANAGER"])) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  try {
    const { id } = await params;
    const { tableId } = await request.json();
    if (!tableId) return NextResponse.json({ error: "Select a table before seating the guest." }, { status: 400 });
    const seated = await prisma.$transaction(async (tx) => {
      const entry = await tx.waitlistEntry.findUnique({ where: { id }, include: { customer: true } });
      if (!entry || !["WAITING", "NOTIFIED"].includes(entry.status)) throw new Error("WAITLIST_ENTRY_NOT_FOUND");
      const table = await tx.diningTable.findUnique({ where: { id: tableId } });
      if (!table?.active || table.capacity < entry.guests) throw new Error("TABLE_NOT_SUITABLE");
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 90 * 60_000);
      const overlap = await tx.reservation.findFirst({ where: { tableId, status: { in: ["CONFIRMED", "SEATED"] }, startTime: { lt: endTime }, endTime: { gt: startTime } } });
      if (overlap) throw new Error("TABLE_UNAVAILABLE");
      const reservation = await tx.reservation.create({ data: { customerId: entry.customerId, tableId, startTime, endTime, guests: entry.guests, status: "SEATED", notes: entry.notes || "Walk-in" }, include: { customer: true, table: true } });
      await tx.waitlistEntry.update({ where: { id }, data: { status: "SEATED" } });
      return reservation;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ reservation: seated });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = { WAITLIST_ENTRY_NOT_FOUND: "This guest is no longer waiting.", TABLE_NOT_SUITABLE: "This table cannot accommodate the party.", TABLE_UNAVAILABLE: "This table is no longer available." };
    return NextResponse.json({ error: messages[code] || "Could not seat this guest. Please try again." }, { status: 400 });
  }
}
