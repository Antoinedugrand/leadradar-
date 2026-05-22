import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const emailSchema = z.object({
  prospectId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(3),
  body: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = emailSchema.parse(body);
    const env = getServerEnv();
    const resendApiKey = env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const supabase = getSupabaseServerClient();

    const unsubscribeUrl = `${appBaseUrl}/unsubscribe?prospectId=${payload.prospectId}`;
    const footer = `\n\n---\nSi vous ne souhaitez plus recevoir d'emails, cliquez ici: ${unsubscribeUrl}`;
    const bodyWithFooter = payload.body.includes("désinscription")
      ? payload.body
      : `${payload.body}${footer}`;

    const sendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        text: bodyWithFooter,
      }),
    });

    if (!sendResponse.ok) {
      const resendError = await sendResponse.text();
      return NextResponse.json(
        { error: "Échec d'envoi via Resend.", details: resendError },
        { status: sendResponse.status },
      );
    }

    const { error: insertLogError } = await supabase.from("email_logs").insert({
      prospect_id: payload.prospectId,
      subject: payload.subject,
      body: bodyWithFooter,
    });
    if (insertLogError) {
      return NextResponse.json(
        { error: "Email envoyé, mais échec du log Supabase." },
        { status: 500 },
      );
    }

    const { error: updateProspectError } = await supabase
      .from("prospects")
      .update({ status: "emailed", emailed_at: new Date().toISOString() })
      .eq("id", payload.prospectId);
    if (updateProspectError) {
      return NextResponse.json(
        { error: "Email envoyé, mais échec de mise à jour du prospect." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Email envoyé et journalisé.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Requête invalide.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Erreur serveur pendant l'envoi email." }, { status: 500 });
  }
}
