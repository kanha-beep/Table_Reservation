import { NextRequest, NextResponse } from "next/server";
import { readEdgeRole } from "@/lib/authEdge";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard") && !await readEdgeRole(request)) {
    return NextResponse.redirect(new URL("/staff-login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
