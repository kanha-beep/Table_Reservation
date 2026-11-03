import type { NextRequest } from "next/server";
import type { Role } from "./auth";

async function signature(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function readEdgeRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get("tablewise_session")?.value;
  if (!token) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided || provided !== await signature(payload)) return null;
  try { const session = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))); return session.expires > Date.now() && ["STAFF", "MANAGER"].includes(session.role) ? session.role : null; } catch { return null; }
}
