import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reservationTime } from "@/lib/reservationSlots";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const guests = Number(searchParams.get("guests"));
  const startTime = reservationTime(date, time);
  if (!startTime || !Number.isInteger(guests) || guests < 1 || guests > 12) return NextResponse.json({ error: "Select a valid date, time, and party size." }, { status: 400 });
  const endTime = new Date(startTime.getTime() + 90 * 60_000);
  const suitableTables = await prisma.diningTable.findMany({ where: { active: true, capacity: { gte: guests } }, orderBy: { capacity: "asc" } });
  const occupied = await prisma.reservation.findMany({ where: { tableId: { in: suitableTables.map(table => table.id) }, status: { in: ["CONFIRMED", "SEATED"] }, startTime: { lt: endTime }, endTime: { gt: startTime } }, select: { tableId: true } });
  const occupiedIds = new Set(occupied.map(item => item.tableId));
  const tables = suitableTables.filter(table => !occupiedIds.has(table.id)).map(table => ({ id: table.id, name: table.name, capacity: table.capacity }));
  return NextResponse.json({ available: tables.length > 0, count: tables.length, tables });
}
