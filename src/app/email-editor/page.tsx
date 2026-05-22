import { MainNav } from "@/components/main-nav";
import { EmailEditorClient } from "@/components/email-editor-client";

export default function EmailEditorPage() {
  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <EmailEditorClient />
      </main>
    </>
  );
}
