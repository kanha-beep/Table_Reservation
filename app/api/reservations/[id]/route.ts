import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!requireRole(request, ["STAFF", "MANAGER"])) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  try {
    const { id } = await params;
    const { name, date, time, tableId } = await request.json();
    if (!name?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^\d{2}:\d{2}$/.test(time || "")) {
      return NextResponse.json({ error: "Enter a guest name, date, and time." }, { status: 400 });
    }
    const startTime = new Date(`${date}T${time}:00+05:30`);
    if (Number.isNaN(startTime.getTime())) return NextResponse.json({ error: "Enter a valid booking date and time." }, { status: 400 });
    const endTime = new Date(startTime.getTime() + 90 * 60_000);
    const current = await prisma.reservation.findUnique({ where: { id }, select: { guests: true } });
    if (!current) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    const selectedTableId = tableId || null;
    if (selectedTableId) {
      const table = await prisma.diningTable.findUnique({ where: { id: selectedTableId } });
      if (!table?.active || table.capacity < current.guests) return NextResponse.json({ error: "This table cannot accommodate the party size." }, { status: 400 });
      const overlap = await prisma.reservation.findFirst({
        where: { id: { not: id }, tableId: selectedTableId, status: { in: ["CONFIRMED", "SEATED"] }, startTime: { lt: endTime }, endTime: { gt: startTime } }
      });
      if (overlap) return NextResponse.json({ error: "This table is already assigned during that time." }, { status: 409 });
    }
    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        startTime,
        endTime,
        table: selectedTableId ? { connect: { id: selectedTableId } } : { disconnect: true },
        customer: { update: { name: name.trim() } }
      },
      include: { customer: true, table: true }
    });
    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Reservation update failed:", error);
    return NextResponse.json({ error: "The reservation could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!requireRole(request, ["STAFF", "MANAGER"])) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "The reservation could not be deleted." }, { status: 404 }); }
}
