import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export type Role = "STAFF" | "MANAGER";
const COOKIE = "tablewise_session";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured.");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSession(role: Role) {
  const payload = Buffer.from(JSON.stringify({ role, expires: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readRole(request: NextRequest): Role | null {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  const expected = payload ? sign(payload) : "";
  if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.expires > Date.now() && ["STAFF", "MANAGER"].includes(data.role) ? data.role : null; } catch { return null; }
}

export function setStaffSession(response: NextResponse, role: Role) {
  response.cookies.set(COOKIE, createSession(role), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
}

export function requireRole(request: NextRequest, roles: Role[]) {
  const role = readRole(request);
  return role && roles.includes(role) ? role : null;
}
