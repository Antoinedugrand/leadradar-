/**
 * Point d'entrée aligné sur le guide Claude — même API que le snippet fourni.
 *
 * import { stripe, supabaseAdmin, getOrCreateStripeCustomer } from '@/lib/stripe/admin'
 */
export { getStripe as stripe, getStripeServer } from "@/lib/stripe/server";
export { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
export { supabaseAdmin } from "@/lib/supabase/server";
