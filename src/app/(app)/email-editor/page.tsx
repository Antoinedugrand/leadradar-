import { AppTopbar } from "@/components/app/app-topbar";
import { EmailEditorClient } from "@/components/email-editor-client";
import { getServerT } from "@/lib/i18n/server";

export default async function EmailEditorPage() {
  const { t } = await getServerT();

  return (
    <>
      <AppTopbar
        title={t("nav.email")}
        crumbs={[t("nav.tools"), t("nav.email")]}
        actions={
          <>
            <button type="button" className="lr-btn lr-btn-ghost" disabled>
              {t("emailEditor.history")}
            </button>
            <button type="button" className="lr-btn lr-btn-secondary" disabled>
              {t("emailEditor.preview")}
            </button>
            <button type="button" className="lr-btn lr-btn-gradient" disabled>
              {t("emailEditor.saveTemplate")}
            </button>
          </>
        }
      />
      <div className="lr-content">
        <EmailEditorClient />
      </div>
    </>
  );
}
