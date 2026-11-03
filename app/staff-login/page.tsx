"use client";
import { FormEvent, useState } from "react";

export default function StaffLogin() {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function login(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); try { const accessCode = new FormData(e.currentTarget).get("accessCode"); const res = await fetch("/api/auth/staff-login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ accessCode }) }); if (res.ok) { location.assign("/dashboard"); return; } setError((await res.json()).error); } catch { setError("Could not reach the sign-in service. Please try again."); } finally { setLoading(false); } }
  return <main className="grid min-h-screen place-items-center bg-cream p-6"><form onSubmit={login} className="w-full max-w-md bg-white p-8 shadow-soft"><p className="eyebrow">TABLEWISE · STAFF ONLY</p><h1 className="mt-3 text-5xl">Welcome back</h1><label className="mt-9">Staff access code<input required disabled={loading} autoFocus name="accessCode" type="password" /></label><button disabled={loading} aria-busy={loading} className="mt-5">{loading ? <span className="inline-flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Checking...</span> : "Open dashboard"}</button>{error && <p className="mt-4 text-sm text-terracotta">{error}</p>}</form></main>;
}
