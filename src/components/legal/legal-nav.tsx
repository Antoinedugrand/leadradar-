import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";
import { LEGAL } from "@/lib/legal/constants";

interface LegalNavProps {
  crumb?: string;
}

export function LegalNav({ crumb }: LegalNavProps) {
  return (
    <div className="lr-legal-nav">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <LogoMark size={28} />
        <span
          className="text-[17px] font-bold tracking-[-0.025em] text-[var(--slate-900)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {LEGAL.siteName}
        </span>
      </Link>
      <div className="ml-[18px] text-[13px] text-[var(--slate-500)]">
        <span>Légal</span>
        {crumb ? (
          <>
            <span className="mx-1.5 text-[var(--slate-300)]">/</span>
            <span className="text-[var(--slate-800)]">{crumb}</span>
          </>
        ) : null}
      </div>
      <div className="ml-auto flex gap-2">
        <Link href="/" className="lr-btn lr-btn-ghost lr-btn-sm">
          Retour au site
        </Link>
        <Link href="/dashboard" className="lr-btn lr-btn-gradient lr-btn-sm">
          Application <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
