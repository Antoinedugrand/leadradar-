export type UserPlan = "free" | "pro";

export interface PlanLimits {
  mapSearchesPerMonth: number;
  auditsPerMonth: number;
  aiEmailsPerMonth: number;
  siteMockupsPerMonth: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    mapSearchesPerMonth: 5,
    auditsPerMonth: 3,
    aiEmailsPerMonth: 5,
    siteMockupsPerMonth: 1,
  },
  pro: {
    mapSearchesPerMonth: Number.POSITIVE_INFINITY,
    auditsPerMonth: Number.POSITIVE_INFINITY,
    aiEmailsPerMonth: Number.POSITIVE_INFINITY,
    siteMockupsPerMonth: Number.POSITIVE_INFINITY,
  },
};

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === "pro";
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return isProPlan(plan) ? PLAN_LIMITS.pro : PLAN_LIMITS.free;
}

/** Stripe price alignment: landing shows $29.99/mo; annual TBD in Stripe Dashboard */
export const STRIPE_PRICING = {
  proMonthlyUsd: 29.99,
  proAnnualMonthlyUsd: 23,
} as const;
