"use client";
import { FormEvent, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  timeValue: string;
  tableId: string | null;
  tableName: string | null;
};
type DiningTable = { id: string; name: string; capacity: number; status: "Vacant" | "Reserved" | "Occupied"; detail: string };
type Waitlist = {
  id: string;
  name: string;
  guests: number;
  quotedMins: number | null;
};

export default function AdminDashboard({
  reservations,
  tables,
  waitlist,
}: {
  reservations: Reservation[];
  tables: DiningTable[];
  waitlist: Waitlist[];
}) {
  const [queue, setQueue] = useState(waitlist);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [reservationsList, setReservationsList] = useState(reservations);
  const [tableList, setTableList] = useState(tables);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [savingReservation, setSavingReservation] = useState(false);
  const [editError, setEditError] = useState("");
  const [reservationNotice, setReservationNotice] = useState("");
  const [deletingReservationId, setDeletingReservationId] = useState<string | null>(null);
  const [seating, setSeating] = useState<Waitlist | null>(null);
  const [seatingError, setSeatingError] = useState("");
  const [seatingGuest, setSeatingGuest] = useState(false);
  async function addWalkIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    const form = e.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(form));
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setQueue([
          ...queue,
          {
            id: data.entry.id,
            name: payload.name as string,
            guests: Number(payload.guests),
            quotedMins: payload.quotedMins ? Number(payload.quotedMins) : null,
          },
        ]);
        form.reset();
        setNotice("Walk-in added to the queue.");
      } else setNotice(data.error);
    } catch {
      setNotice("Could not reach the waitlist service. Please try again.");
    } finally {
      setAdding(false);
    }
  }
  async function saveReservation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSavingReservation(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const date = String(form.get("date") || "");
    const timeValue = String(form.get("time") || "");
    const tableId = String(form.get("tableId") || "");
    try {
      const response = await fetch(`/api/reservations/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, date, time: timeValue, tableId }) });
      const data = await response.json();
      if (!response.ok) { setEditError(data.error); return; }
      const time = new Date(`${date}T${timeValue}:00`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      const table = tables.find(item => item.id === tableId);
      setReservationsList(reservationsList.map(item => item.id === editing.id ? { ...item, name, date, time, timeValue, tableId: tableId || null, tableName: table?.name ?? null } : item));
      if (table) setTableList(tableList.map(item => item.id === table.id ? { ...item, status: "Reserved", detail: `${name} · ${time}` } : item));
      setEditing(null); setReservationNotice("Reservation updated.");
    } catch { setEditError("Could not update the reservation. Please try again."); }
    finally { setSavingReservation(false); }
  }
  async function deleteReservation(reservation: Reservation) {
    if (!window.confirm(`Delete ${reservation.name}'s reservation?`)) return;
    setDeletingReservationId(reservation.id);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({ error: `Delete request failed (${response.status}). Restart the Next.js server and try again.` }));
      if (!response.ok) { setReservationNotice(data.error); return; }
      setReservationsList(reservationsList.filter(item => item.id !== reservation.id)); setReservationNotice("Reservation deleted.");
    } catch { setReservationNotice("Could not delete the reservation. Please try again."); }
    finally { setDeletingReservationId(null); }
  }
  async function seatWaitlistGuest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!seating) return;
    setSeatingGuest(true); setSeatingError("");
    const tableId = String(new FormData(e.currentTarget).get("tableId") || "");
    try {
      const response = await fetch(`/api/waitlist/${seating.id}/seat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId }) });
      const data = await response.json();
      if (!response.ok) { setSeatingError(data.error); return; }
      const reservation = data.reservation;
      const startTime = new Date(reservation.startTime);
      const date = startTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const time = startTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
      const timeValue = startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
      setQueue(queue.filter(item => item.id !== seating.id));
      setReservationsList([...reservationsList, { id: reservation.id, name: reservation.customer.name, phone: reservation.customer.phone, guests: reservation.guests, date, time, timeValue, tableId: reservation.tableId, tableName: reservation.table.name }]);
      setTableList(tableList.map(table => table.id === reservation.tableId ? { ...table, status: "Occupied", detail: `${reservation.customer.name} · now` } : table));
      setSeating(null); setReservationNotice(`${reservation.customer.name} is now seated at ${reservation.table.name}.`);
    } catch { setSeatingError("Could not seat this guest. Please try again."); }
    finally { setSeatingGuest(false); }
  }
  return (
    <>
      <ScrollReveal />
      <main className="min-h-screen bg-cream px-4 py-5 text-ink sm:px-6 sm:py-7 lg:px-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between">
          <a className="brand" href="/">
            tablewise<span>.</span>
          </a>
          <span className="rounded-full bg-sage/25 px-3 py-2 text-[10px] font-bold sm:px-4 sm:text-xs">
            STAFF VIEW
          </span>
        </header>
        <div className="mx-auto mt-9 grid max-w-7xl gap-7 lg:mt-12 lg:grid-cols-[1.6fr_.8fr]">
          <section suppressHydrationWarning className="bottomup">
            <p className="eyebrow">TODAY&apos;S SERVICE</p>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl">
              Reservations
            </h1>
            {reservationNotice && <p className="mt-3 text-sm text-terracotta">{reservationNotice}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {tableList.map((table) => <div key={table.id} className="border border-sand bg-white p-3"><div className="flex items-center justify-between"><b className="font-display text-lg">{table.name}</b><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${table.status === "Vacant" ? "bg-sage/25 text-moss" : table.status === "Reserved" ? "bg-terracotta/15 text-terracotta" : "bg-ink text-white"}`}>{table.status}</span></div><p className="mt-2 text-[11px] text-zinc-500">{table.capacity} seats · {table.detail}</p></div>)}
            </div>
            <div className="mt-6 overflow-hidden bg-white shadow-soft sm:mt-8">
              <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-zinc-100 px-6 py-4 text-[10px] font-bold tracking-widest text-zinc-400 sm:grid">
                <span>GUEST</span>
                <span>PARTY</span>
                <span>TIME</span>
              </div>
              {reservationsList.length ? (
                reservationsList.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-100 px-4 py-4 last:border-0 sm:grid sm:grid-cols-[1fr_auto_auto] sm:px-6 sm:py-5"
                  >
                    <div className="min-w-[58%]">
                      <p className="font-semibold">{r.name}</p>
                      <p className="mt-1 text-xs text-zinc-400">{r.phone}</p>
                    </div>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs">
                      {r.guests} guests
                    </span>
                    <div className="flex items-center gap-3"><span className="font-display text-base sm:text-lg">{r.time}</span><span className="rounded-full bg-sage/25 px-2 py-1 text-[10px] font-bold">{r.tableName ?? "Unassigned"}</span><div className="flex gap-2"><button type="button" disabled={deletingReservationId === r.id} onClick={() => { setEditing(r); setEditError(""); }} className="!mt-0 !min-h-0 !bg-transparent !p-0 text-xs !text-moss hover:!text-terracotta">Edit</button><button type="button" disabled={deletingReservationId === r.id} aria-busy={deletingReservationId === r.id} onClick={() => deleteReservation(r)} className="!mt-0 !min-h-0 !bg-transparent !p-0 text-xs !text-terracotta hover:!text-ink">{deletingReservationId === r.id ? <span className="inline-flex items-center gap-1"><span className="h-3 w-3 animate-spin rounded-full border-2 border-terracotta/30 border-t-terracotta" />Deleting...</span> : "Delete"}</button></div></div>
                  </div>
                ))
              ) : (
                <p className="p-6 text-sm text-zinc-500 sm:p-8">
                  No upcoming reservations.
                </p>
              )}
            </div>
          </section>
          <aside
            suppressHydrationWarning
            className="bottomup bg-ink p-5 text-white sm:p-7"
          >
            <p className="eyebrow">WALK-IN QUEUE</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Waitlist</h2>
            <div className="mt-7 space-y-3">
              {queue.length ? (
                queue.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-3 border-b border-white/15 pb-3"
                  >
                    <span className="min-w-0 truncate">
                      <b className="mr-3 text-white">
                        {String(i + 1).padStart(2, "0")}
                      </b>
                      {q.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-300">{q.guests} · {q.quotedMins ?? "—"}m<button type="button" onClick={() => { setSeating(q); setSeatingError(""); }} className="!mt-0 !min-h-0 !bg-sage !px-2 !py-1 !text-[10px] !text-ink hover:!bg-white">Seat</button></span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">Queue is clear.</p>
              )}
            </div>
            <form
              onSubmit={addWalkIn}
              className="mt-8 grid gap-3 bg-white p-4 shadow-soft sm:grid-cols-1"
            >
              <input required name="name" placeholder="Guest name" />
              <input
                required
                name="phone"
                inputMode="tel"
                placeholder="Phone number"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  name="guests"
                  aria-label="Guest count"
                  type="number"
                  min="1"
                  defaultValue="2"
                />
                <input
                  name="quotedMins"
                  aria-label="Quoted wait minutes"
                  type="number"
                  min="5"
                  placeholder="Wait mins"
                />
              </div>
              <button disabled={adding} aria-busy={adding}>
                {adding ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Adding...
                  </span>
                ) : (
                  "Add walk-in"
                )}
              </button>
              {notice && <p className="text-xs text-sage">{notice}</p>}
            </form>
          </aside>
        </div>
      </main>
      {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4"><form onSubmit={saveReservation} className="w-full max-w-md bg-white p-6 shadow-soft"><p className="eyebrow">EDIT RESERVATION</p><h2 className="mt-2 text-3xl">Update booking</h2><label className="mt-6 sm:col-span-2">Guest name<input required name="name" defaultValue={editing.name} /></label><label>Date<input required name="date" type="date" defaultValue={editing.date} /></label><label>Time<input required name="time" type="time" defaultValue={editing.timeValue} /></label><label className="sm:col-span-2">Assign table<select name="tableId" defaultValue={editing.tableId ?? ""}><option value="">Leave unassigned</option>{tables.filter(table => table.capacity >= editing.guests).map(table => <option key={table.id} value={table.id}>{table.name} · seats {table.capacity}</option>)}</select></label>{editError && <p className="col-span-full text-sm text-terracotta">{editError}</p>}<div className="col-span-full mt-2 flex gap-3"><button type="button" onClick={() => setEditing(null)} className="!mt-0 flex-1 !bg-zinc-200 !text-ink hover:!bg-zinc-300">Cancel</button><button disabled={savingReservation} aria-busy={savingReservation} className="!mt-0 flex-1">{savingReservation ? "Saving..." : "Save changes"}</button></div></form></div>}
      {seating && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4"><form onSubmit={seatWaitlistGuest} className="w-full max-w-md bg-white p-6 shadow-soft"><p className="eyebrow">SEAT WALK-IN</p><h2 className="mt-2 text-3xl">{seating.name}</h2><p className="mt-2 text-sm text-zinc-500">Choose a vacant table for {seating.guests} guests.</p><label className="mt-6 sm:col-span-2">Vacant table<select required name="tableId" defaultValue=""><option value="" disabled>Select a table</option>{tableList.filter(table => table.status === "Vacant" && table.capacity >= seating.guests).map(table => <option key={table.id} value={table.id}>{table.name} · seats {table.capacity}</option>)}</select></label>{!tableList.some(table => table.status === "Vacant" && table.capacity >= seating.guests) && <p className="col-span-full text-sm text-terracotta">No suitable vacant table is available.</p>}{seatingError && <p className="col-span-full text-sm text-terracotta">{seatingError}</p>}<div className="col-span-full mt-2 flex gap-3"><button type="button" onClick={() => setSeating(null)} className="!mt-0 flex-1 !bg-zinc-200 !text-ink hover:!bg-zinc-300">Cancel</button><button disabled={seatingGuest} aria-busy={seatingGuest} className="!mt-0 flex-1">{seatingGuest ? "Seating..." : "Seat guest"}</button></div></form></div>}
    </>
  );
}
