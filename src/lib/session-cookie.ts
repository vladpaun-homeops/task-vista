export const SESSION_COOKIE_NAME = "demo_session_id";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const SESSION_HEADER_NAME = "x-demo-session-id";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_COOKIE_MAX_AGE,
};
