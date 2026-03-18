import { createClient } from "@/utils/supabase/server";
import DashboardShell from "../components/DashboardShell";
import { ProjectsProvider } from "../context/ProjectsContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialDisplayName: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const name = (profile?.display_name as string) ?? "";
    initialDisplayName = name.trim() || null;
  }
  return (
    <DashboardShell initialDisplayName={initialDisplayName}>
      <ProjectsProvider>{children}</ProjectsProvider>
    </DashboardShell>
  );
}
