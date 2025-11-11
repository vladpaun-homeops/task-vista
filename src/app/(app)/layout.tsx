import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { SessionCookieSync } from "@/components/session/session-cookie-sync";
import { WelcomeModal } from "@/components/session/welcome-modal";
import { getOrCreateSession } from "@/server/session";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getOrCreateSession();
  return (
    <>
      <SessionCookieSync sessionId={session.id} />
      <AppShell>
        <WelcomeModal sessionId={session.id} />
        {children}
      </AppShell>
    </>
  );
}
