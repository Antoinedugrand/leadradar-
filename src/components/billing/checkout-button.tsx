"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

interface CheckoutButtonProps {
  priceId: string;
  label: string;
  className?: string;
}

export function CheckoutButton({ priceId, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Checkout failed.");
      }
      if (!payload.url) {
        throw new Error("Missing checkout URL.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={className ?? "lr-btn lr-btn-gradient"}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {label}
      </button>
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
    </div>
  );
}
