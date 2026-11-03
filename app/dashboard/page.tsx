import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [reservations, waitlist, tables] = await Promise.all([
    prisma.reservation.findMany({ where: { startTime: { gte: today }, status: { in: ["CONFIRMED", "SEATED"] } }, include: { customer: true, table: true }, orderBy: { startTime: "asc" }, take: 20 }),
    prisma.waitlistEntry.findMany({ where: { status: { in: ["WAITING", "NOTIFIED"] } }, include: { customer: true }, orderBy: { createdAt: "asc" } }),
    prisma.diningTable.findMany({ where: { active: true }, orderBy: { capacity: "asc" }, include: { reservations: { where: { status: { in: ["CONFIRMED", "SEATED"] }, endTime: { gte: today } }, include: { customer: true }, orderBy: { startTime: "asc" } } } })
  ]);
  const now = new Date();
  return <AdminDashboard reservations={reservations.map(r => ({ id: r.id, name: r.customer.name, phone: r.customer.phone, guests: r.guests, date: r.startTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), time: r.startTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }), timeValue: r.startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }), tableId: r.tableId, tableName: r.table?.name ?? null }))} tables={tables.map(table => { const active = table.reservations.find(reservation => reservation.startTime <= now && reservation.endTime > now); const upcoming = table.reservations.find(reservation => reservation.startTime > now); const reservation = active || upcoming; const status = active ? (active.status === "SEATED" ? "Occupied" : "Reserved") : upcoming ? "Reserved" : "Vacant"; return { id: table.id, name: table.name, capacity: table.capacity, status, detail: reservation ? `${reservation.customer.name} · ${reservation.startTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}` : "Available now" }; })} waitlist={waitlist.map(w => ({ id: w.id, name: w.customer.name, guests: w.guests, quotedMins: w.quotedMins }))} />;
}
