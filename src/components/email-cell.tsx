"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";

interface EmailCellProps {
  email: string | null;
}

export function EmailCell({ email }: EmailCellProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative pr-8 text-muted-foreground">
      <span>{email ?? "—"}</span>
      {email ? (
        <button
          type="button"
          onClick={copyEmail}
          title={t("emailDialog.copyEmail")}
          className="absolute right-0 top-0 rounded-md border border-border bg-background p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </div>
  );
}
