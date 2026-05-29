import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Récupère ou crée un customer Stripe pour un user donné.
 * Sauvegarde le stripe_customer_id dans Supabase si nouveau.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de lire le profil billing.");
  }

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await getStripe().customers.create({
    email: email || undefined,
    metadata: { userId },
  });

  const { error: upsertError } = await supabaseAdmin.from("users").upsert(
    {
      id: userId,
      email: email || "",
      stripe_customer_id: customer.id,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    throw new Error("Client Stripe créé, mais échec de sauvegarde Supabase.");
  }

  return customer.id;
}
