import DashboardShell from "../components/DashboardShell";
import { ProjectsProvider } from "../context/ProjectsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <ProjectsProvider>{children}</ProjectsProvider>
    </DashboardShell>
  );
}
