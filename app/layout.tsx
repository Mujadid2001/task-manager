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
      <body className="flex min-h-dvh flex-col">
        <header className="border-border-subtle border-b bg-white">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <span
              aria-hidden="true"
              className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            >
              T
            </span>
            <div className="flex flex-col">
              <span className="text-base leading-tight font-semibold tracking-tight text-slate-900">
                Task Manager
              </span>
              <span className="text-xs leading-tight text-slate-500">
                Keep track of what matters
              </span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
