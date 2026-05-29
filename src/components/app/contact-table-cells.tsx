"use client";

import { ContactSourceHint } from "@/components/app/contact-source-hint";
import type { ContactSource } from "@/lib/types";

interface ContactEmailCellProps {
  email: string | null;
  source?: ContactSource | null;
}

interface ContactPhoneCellProps {
  phone: string | null;
  source?: ContactSource | null;
}

export function ContactEmailCell({ email, source }: ContactEmailCellProps) {
  if (!email) {
    return <span className="lr-mono text-xs text-[var(--slate-500)]">—</span>;
  }

  return (
    <div className="lr-mono text-xs text-[var(--slate-700)]">
      <a href={`mailto:${email}`} className="text-[var(--indigo)] no-underline hover:underline">
        {email}
      </a>
      <ContactSourceHint source={source} />
    </div>
  );
}

export function ContactPhoneCell({ phone, source }: ContactPhoneCellProps) {
  if (!phone) {
    return <span className="lr-mono text-xs text-[var(--slate-500)]">—</span>;
  }

  const telHref = phone.replace(/[^\d+]/g, "");

  return (
    <div className="lr-mono text-xs text-[var(--slate-700)]">
      <a href={`tel:${telHref}`} className="text-[var(--slate-800)] no-underline hover:text-[var(--indigo)]">
        {phone}
      </a>
      <ContactSourceHint source={source} />
    </div>
  );
}
