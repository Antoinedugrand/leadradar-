import type { ContactSource } from "./types";
import type { SocialLink } from "@/lib/types";
import { mergeSocialLinks } from "./extract-social";

export interface ContactFields {
  email?: string | null;
  phone?: string | null;
  email_source?: ContactSource | null;
  phone_source?: ContactSource | null;
  contacts_enriched_at?: string | null;
  social_links?: SocialLink[] | null;
}

export function mergeContactFields(
  existing: ContactFields | null | undefined,
  incoming: ContactFields,
): ContactFields {
  const email = incoming.email ?? existing?.email ?? null;
  const phone = incoming.phone ?? existing?.phone ?? null;

  return {
    email,
    phone,
    email_source: incoming.email ? (incoming.email_source ?? existing?.email_source ?? null) : existing?.email_source ?? null,
    phone_source: incoming.phone
      ? (incoming.phone_source ?? existing?.phone_source ?? null)
      : existing?.phone_source ?? null,
    contacts_enriched_at:
      incoming.contacts_enriched_at ?? existing?.contacts_enriched_at ?? null,
    social_links: mergeSocialLinks(existing?.social_links, incoming.social_links),
  };
}
