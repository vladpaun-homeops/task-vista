import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "To Do App",
  description: "AI-powered Task Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
