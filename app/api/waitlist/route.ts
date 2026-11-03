import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!requireRole(request, ["STAFF", "MANAGER"])) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    const { name, phone, guests, quotedMins, notes } = await request.json();
    if (!name || !phone || !Number.isInteger(Number(guests))) return NextResponse.json({ error: "Name, phone and guest count are required." }, { status: 400 });
    const customer = await prisma.customer.upsert({ where: { phone }, update: { name }, create: { name, phone } });
    const entry = await prisma.waitlistEntry.create({ data: { customerId: customer.id, guests: Number(guests), quotedMins: quotedMins ? Number(quotedMins) : null, notes: notes || null } });
    return NextResponse.json({ entry }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not add the walk-in to the waitlist." }, { status: 500 }); }
}
