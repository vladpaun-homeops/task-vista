"use client";

import { useEffect } from "react";

import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
} from "@/lib/session-cookie";

type SessionCookieSyncProps = {
  sessionId: string;
};

export function SessionCookieSync({ sessionId }: SessionCookieSyncProps) {
  useEffect(() => {
    if (!sessionId || typeof document === "undefined") {
      return;
    }

    const hasCookie = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=${sessionId}`));

    if (!hasCookie) {
      document.cookie = `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, [sessionId]);

  return null;
}
