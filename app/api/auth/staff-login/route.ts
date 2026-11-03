import { NextRequest, NextResponse } from "next/server";
import { setStaffSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const { accessCode } = await request.json();
  if (!process.env.STAFF_ACCESS_CODE || accessCode !== process.env.STAFF_ACCESS_CODE) return NextResponse.json({ error: "Invalid staff access code." }, { status: 401 });
  const response = NextResponse.json({ ok: true }); setStaffSession(response, "STAFF"); return response;
}
