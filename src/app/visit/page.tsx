import Link from "next/link";
import { redirect } from "next/navigation";

import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

interface VisitPageProps {
  searchParams: Promise<{ url?: string }>;
}

function normalizeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    try {
      const parsed = new URL(`https://${value}`);
      return parsed.toString();
    } catch {
      return null;
    }
  }
}

export default async function VisitPage({ searchParams }: VisitPageProps) {
  const { t } = await getServerT();
  const params = await searchParams;
  const rawUrl = params.url;

  if (!rawUrl) {
    return (
      <>
        <MainNav />
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("visit.missingLink")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("visit.noUrl")}</p>
          <Button asChild className="mt-6">
            <Link href="/prospects">{t("visit.back")}</Link>
          </Button>
        </main>
      </>
    );
  }

  const safeUrl = normalizeExternalUrl(rawUrl);
  if (!safeUrl) {
    return (
      <>
        <MainNav />
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("visit.invalid")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("visit.invalidUrl")}</p>
          <Button asChild className="mt-6">
            <Link href="/prospects">{t("visit.back")}</Link>
          </Button>
        </main>
      </>
    );
  }

  redirect(safeUrl);
}
