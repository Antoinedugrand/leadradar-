import Link from "next/link";

import { LEGAL } from "@/lib/legal/constants";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-bold tracking-tight text-foreground">
            {LEGAL.siteName}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/legal" className="text-muted-foreground hover:text-foreground">
              Légal
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Application
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
