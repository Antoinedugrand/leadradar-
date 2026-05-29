import { CheckoutButton } from "@/components/billing/checkout-button";
import { isProPlan, STRIPE_PRICING } from "@/lib/billing/plans";

interface SubscriptionPanelProps {
  plan: string | null | undefined;
  subscriptionStatus: string | null | undefined;
  monthlyPriceId: string;
  yearlyPriceId: string;
  checkoutMessage?: "success" | "canceled" | null;
}

export function SubscriptionPanel({
  plan,
  subscriptionStatus,
  monthlyPriceId,
  yearlyPriceId,
  checkoutMessage,
}: SubscriptionPanelProps) {
  const isActivePro = isProPlan(plan) && subscriptionStatus === "active";

  return (
    <section className="lr-card lr-card-pad-lg">
      <div className="lr-card-title mb-1">Subscription</div>
      <p className="mb-4 text-[13px] text-[var(--slate-500)]">
        Manage your LeadRadar plan. Free includes limited searches, audits, and AI emails.
      </p>

      {checkoutMessage === "success" ? (
        <p className="mb-4 rounded-lg border border-[var(--emerald)]/30 bg-[var(--emerald)]/10 px-3 py-2 text-sm text-[var(--emerald)]">
          Payment received — your Pro plan will activate once Stripe confirms the subscription.
        </p>
      ) : null}

      {checkoutMessage === "canceled" ? (
        <p className="mb-4 rounded-lg border border-[var(--slate-200)] bg-[var(--slate-50)] px-3 py-2 text-sm text-[var(--slate-600)]">
          Checkout canceled. You can upgrade anytime.
        </p>
      ) : null}

      <div className="mb-5 flex items-center gap-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: isActivePro ? "rgba(67,56,202,0.08)" : "var(--slate-100)",
            color: isActivePro ? "var(--indigo)" : "var(--slate-600)",
          }}
        >
          {isActivePro ? "Pro" : "Free"}
        </span>
        {subscriptionStatus ? (
          <span className="text-sm text-[var(--slate-500)]">Status: {subscriptionStatus}</span>
        ) : null}
      </div>

      {isActivePro ? (
        <p className="text-sm text-[var(--slate-600)]">
          You have unlimited access to map search, audits, AI emails, and site mockups.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <CheckoutButton
            priceId={monthlyPriceId}
            label={`Upgrade — $${STRIPE_PRICING.proMonthlyUsd}/mo`}
            className="lr-btn lr-btn-gradient justify-center"
          />
          <CheckoutButton
            priceId={yearlyPriceId}
            label={`Upgrade — $${STRIPE_PRICING.proAnnualMonthlyUsd}/mo (annual)`}
            className="lr-btn lr-btn-ghost justify-center"
          />
        </div>
      )}
    </section>
  );
}
