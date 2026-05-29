export function UpgradeSuccessBanner() {
  return (
    <p className="mb-5 rounded-lg border border-[var(--emerald)]/30 bg-[var(--emerald)]/10 px-4 py-3 text-sm text-[var(--emerald)]">
      Payment received — your Pro plan will activate once Stripe confirms the subscription.
    </p>
  );
}
