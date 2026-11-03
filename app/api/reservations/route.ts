import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendReservationConfirmation } from "@/lib/whatsApp";
import { reservationSlots, reservationTime } from "@/lib/reservationSlots";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const limit = rateLimit(`reservation:${ip}`, 4, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many booking attempts. Please wait a moment." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const body = await request.json();
    const guests = Number(body.guests);
    if (!body.name || !body.phone || !body.date || !reservationSlots[body.time] || !Number.isInteger(guests) || guests < 1 || guests > 12) {
      return NextResponse.json({ error: "Please provide a valid name, phone number, date, time, and guest count." }, { status: 400 });
    }
    const startTime = reservationTime(body.date, body.time)!;
    if (startTime <= new Date()) return NextResponse.json({ error: "Please select a future booking time." }, { status: 400 });
    const endTime = new Date(startTime.getTime() + 90 * 60_000);
    const reservation = await prisma.$transaction(async (tx) => {
      const suitableTables = await tx.diningTable.findMany({ where: { active: true, capacity: { gte: guests } }, orderBy: { capacity: "asc" } });
      const occupied = await tx.reservation.findMany({
        where: { tableId: { in: suitableTables.map(table => table.id) }, status: { in: ["CONFIRMED", "SEATED"] }, startTime: { lt: endTime }, endTime: { gt: startTime } },
        select: { tableId: true }
      });
      const occupiedTableIds = new Set(occupied.map(item => item.tableId));
      const table = suitableTables.find(item => !occupiedTableIds.has(item.id));
      if (!table) return null;
      const customer = await tx.customer.upsert({ where: { phone: body.phone }, update: { name: body.name }, create: { name: body.name, phone: body.phone } });
      return tx.reservation.create({ data: { customerId: customer.id, tableId: table.id, startTime, endTime, guests, notes: body.notes || null }, include: { table: { select: { name: true } } } });
    }, { isolationLevel: "Serializable" });
    if (!reservation) return NextResponse.json({ error: "No table is available for this time and party size. Please choose another time." }, { status: 409 });
    void sendReservationConfirmation({ phone: body.phone, name: body.name, startTime, guests, tableName: reservation.table?.name || "To be confirmed" })
      .catch((error) => console.error("WhatsApp confirmation failed:", error));
    return NextResponse.json({ reservation: { id: reservation.id, startTimeLabel: startTime.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }, whatsappQueued: true }, { status: 201 });
  } catch (error) {
    console.error("Reservation creation failed:", error);
    return NextResponse.json({ error: "The reservation could not be saved. Please try again." }, { status: 500 });
  }
}
