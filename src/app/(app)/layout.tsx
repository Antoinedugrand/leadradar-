import { AppSidebar } from "@/components/app/app-sidebar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = getSupabaseServerClient();

  const [{ count: prospectsCount }, { count: contactedCount }] = await Promise.all([
    supabase
      .from("prospects")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "audited"]),
    supabase
      .from("prospects")
      .select("*", { count: "exact", head: true })
      .in("status", ["emailed", "replied", "converted"]),
  ]);

  return (
    <div className="app-shell">
      <AppSidebar
        prospectsCount={prospectsCount ?? 0}
        contactedCount={contactedCount ?? 0}
      />
      <main className="lr-main">
        <div className="lr-scroll">{children}</div>
      </main>
    </div>
  );
}
