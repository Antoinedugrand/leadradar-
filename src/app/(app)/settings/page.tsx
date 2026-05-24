import { Globe, Mail, Shield, ShoppingBag, SlidersHorizontal } from "lucide-react";

import { AppTopbar } from "@/components/app/app-topbar";
import { getServerT } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const { t } = await getServerT();

  const navItems = [
    { label: t("settings.senderAccount"), active: true, icon: Mail },
    { label: t("settings.searchApi"), active: false, icon: SlidersHorizontal },
    { label: t("settings.notifications"), active: false, icon: Mail },
    { label: t("settings.subscription"), active: false, icon: ShoppingBag },
    { label: t("settings.security"), active: false, icon: Shield },
    { label: t("settings.languageRegion"), active: false, icon: Globe },
  ];

  return (
    <>
      <AppTopbar title={t("settings.title")} crumbs={[t("nav.tools"), t("nav.settings")]} />
      <div className="lr-content">
        <div className="grid max-w-[1080px] grid-cols-1 gap-7 lg:grid-cols-[220px_1fr]">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`lr-nav-item ${item.active ? "active" : ""}`}
                  style={{ padding: "10px 12px" }}
                >
                  <span className="lr-nav-ico">
                    <Icon size={16} />
                  </span>
                  {item.label}
                </div>
              );
            })}
          </nav>

          <div className="flex flex-col gap-5">
            <section className="lr-card lr-card-pad-lg">
              <div className="lr-card-title mb-1">{t("settings.senderAccount")}</div>
              <p className="mb-6 text-[13px] text-[var(--slate-500)]">
                {t("settings.senderHint")}{" "}
                <code className="lr-mono text-[var(--indigo)]">{`{expediteur_nom}`}</code>{" "}
                {t("settings.senderHintSuffix")}
              </p>

              <label className="lr-label" htmlFor="sender-name">
                {t("settings.senderName")}
              </label>
              <input id="sender-name" className="lr-input mb-4" placeholder="Antoine" />

              <label className="lr-label" htmlFor="sender-email">
                {t("settings.senderEmail")}
              </label>
              <input
                id="sender-email"
                type="email"
                className="lr-input lr-mono mb-4"
                placeholder="hello@leadsite.app"
              />

              <label className="lr-label" htmlFor="sender-studio">
                {t("settings.studioOptional")}
              </label>
              <input id="sender-studio" className="lr-input mb-5" placeholder="Studio Wave" />

              <label className="lr-label" htmlFor="sender-signature">
                {t("settings.signature")}
              </label>
              <textarea
                id="sender-signature"
                className="lr-input mb-5 text-[13px] leading-relaxed"
                rows={3}
                defaultValue={"Antoine — LeadRadar\nleadradar.us"}
              />

              <div className="flex gap-2.5">
                <button type="button" className="lr-btn lr-btn-gradient">
                  {t("common.save")}
                </button>
                <button type="button" className="lr-btn lr-btn-ghost">
                  {t("common.cancel")}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
