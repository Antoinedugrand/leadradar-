import { MainNav } from "@/components/main-nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const { t } = await getServerT();

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>

        <section className="mt-6 grid gap-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sender-name">{t("settings.senderName")}</Label>
            <Input id="sender-name" placeholder="Antoine" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sender-email">{t("settings.senderEmail")}</Label>
            <Input id="sender-email" type="email" placeholder="hello@leadsite.app" />
          </div>
          <div className="flex justify-end">
            <Button>{t("common.save")}</Button>
          </div>
        </section>
      </main>
    </>
  );
}
