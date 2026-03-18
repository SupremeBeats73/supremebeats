import { getDashboardData } from "../lib/dashboardData";
import DashboardPageContent from "./DashboardPageContent";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardPageContent data={data} />;
}
