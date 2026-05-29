import { AppSidebar } from "@/components/app/app-sidebar";
import { getServerUser } from "@/lib/supabase/server-user";

export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerUser();
  const supabase = session?.supabase;

  const [{ count: prospectsCount }, { count: contactedCount }] = supabase
    ? await Promise.all([
        supabase
          .from("prospects")
          .select("*", { count: "exact", head: true })
          .in("status", ["new", "audited"]),
        supabase
          .from("prospects")
          .select("*", { count: "exact", head: true })
          .in("status", ["emailed", "replied", "converted"]),
      ])
    : [{ count: 0 }, { count: 0 }];

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
