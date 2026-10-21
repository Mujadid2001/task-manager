import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Task Manager",
    template: "%s | Task Manager",
  },
  description:
    "A fast, focused task manager for keeping track of what matters. Built with Next.js and PostgreSQL.",
  applicationName: "Task Manager",
  openGraph: {
    title: "Task Manager",
    description:
      "A fast, focused task manager for keeping track of what matters.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
