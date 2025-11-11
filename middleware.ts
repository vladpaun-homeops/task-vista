import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_HEADER_NAME,
} from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  let sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SESSION_HEADER_NAME, sessionId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
