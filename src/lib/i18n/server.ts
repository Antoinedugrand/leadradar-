import { cookies } from "next/headers";

import { createT } from "./index";
import { parseLocale } from "./index";
import { LOCALE_COOKIE, type Locale } from "./types";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

export async function getServerT() {
  const locale = await getServerLocale();
  return { locale, t: createT(locale) };
}
