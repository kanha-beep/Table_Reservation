"use client";

import { FormEvent, useEffect, useState } from "react";
import HeroAnimation from "@/components/HeroAnimation";
import ScrollReveal from "@/components/ScrollReveal";

const times = ["5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
type Availability = { state: "idle" | "loading" | "available" | "unavailable"; count?: number };

export default function BookingPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState({ date: "", time: "", guests: "2" });
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });

  useEffect(() => {
    if (!booking.date || !booking.time) { setAvailability({ state: "idle" }); return; }
    const controller = new AbortController();
    setAvailability({ state: "loading" });
    fetch(`/api/availability?date=${booking.date}&time=${encodeURIComponent(booking.time)}&guests=${booking.guests}`, { signal: controller.signal })
      .then(response => response.json())
      .then(data => setAvailability(data.available ? { state: "available", count: data.count } : { state: "unavailable" }))
      .catch(error => { if (error.name !== "AbortError") setAvailability({ state: "idle" }); });
    return () => controller.abort();
  }, [booking]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setMessage("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({ error: `Reservation service returned an invalid response (${response.status}). Check the Next.js terminal.` }));
      setMessage(response.ok ? `Reservation confirmed — ${result.reservation.startTimeLabel}. A WhatsApp confirmation will follow.` : result.error || "Unable to save reservation.");
      if (response.ok) { event.currentTarget.reset(); setBooking({ date: "", time: "", guests: "2" }); }
    } catch { setMessage("We could not reach the reservation service. Please try again."); }
    finally { setLoading(false); }
  }

  return <HeroAnimation><main>
    <nav><div className="brand">tablewise<span>.</span></div><a className="whitespace-nowrap" href="/dashboard">Staff <span className="hidden sm:inline">dashboard </span>→</a></nav>
    <section className="hero">
      <p data-reveal className="eyebrow">ELEVATED DINING, EFFORTLESSLY BOOKED</p>
      <h1 data-reveal>Your table is<br/><i>waiting.</i></h1>
      <p data-reveal className="intro">A thoughtful meal starts with a simple reservation. Choose your evening and we&apos;ll take care of the rest.</p>
    </section>
    <section suppressHydrationWarning className="bottomup booking-card">
      <div><p className="eyebrow">MAKE A RESERVATION</p><h2>Save your seat</h2><p className="muted">We&apos;ll send your confirmation and a friendly reminder on WhatsApp.</p></div>
      <form onSubmit={submit}>
        <label className="sm:col-span-2">Your name<input required name="name" placeholder="Customer Name" /></label>
        <label>Contact number<input required name="phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" /></label>
        <label>Date<input required name="date" type="date" min={new Date().toISOString().slice(0,10)} value={booking.date} onChange={event => setBooking({ ...booking, date: event.target.value })} /></label>
        <label>Time<select required name="time" value={booking.time} onChange={event => setBooking({ ...booking, time: event.target.value })}><option value="" disabled>Select a time</option>{times.map(time => <option key={time}>{time}</option>)}</select></label>
        <label>Guests<select required name="guests" value={booking.guests} onChange={event => setBooking({ ...booking, guests: event.target.value })}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}</select></label>
        <label className="sm:col-span-2">Notes (optional)<input name="notes" placeholder="Allergies, occasion, requests" /></label>
        {availability.state !== "idle" && <p className={`col-span-full text-sm ${availability.state === "available" ? "text-moss" : availability.state === "unavailable" ? "text-terracotta" : "text-zinc-500"}`}>{availability.state === "loading" ? "Checking table availability..." : availability.state === "available" ? `${availability.count} table${availability.count === 1 ? "" : "s"} available for this booking.` : "No suitable table is available at this time."}</p>}
        <button disabled={loading || availability.state === "unavailable"} aria-busy={loading}>{loading ? <span className="inline-flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Confirming...</span> : "Confirm reservation"}</button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
    <footer>TABLEWISE · MODERN HOSPITALITY</footer>
  </main><ScrollReveal /></HeroAnimation>;
}
