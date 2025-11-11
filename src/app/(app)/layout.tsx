import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { SessionCookieSync } from "@/components/session/session-cookie-sync";
import { getOrCreateSession } from "@/server/session";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getOrCreateSession();
  return (
    <>
      <SessionCookieSync sessionId={session.id} />
      <AppShell>{children}</AppShell>
    </>
  );
}
