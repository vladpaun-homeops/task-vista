import "./globals.css";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "TaskVista",
    template: "%s · TaskVista",
  },
  description:
    "TaskVista is a Next.js playground for tasks, tags, calendar drag-and-drop, activity feeds, and reports.",
  openGraph: {
    title: "TaskVista",
    description: "A portfolio demo for experimenting with modern task management flows.",
    url: "http://localhost:3000",
    siteName: "TaskVista",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskVista",
    description: "Demo to-do app with tasks, tags, calendar, activity & reports.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
