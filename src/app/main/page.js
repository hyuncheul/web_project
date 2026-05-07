import { getDashboardSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MainPage() {
  const summary = await getDashboardSummary();
  console.log("[dashboard:data]", JSON.stringify(summary));
  return null;
}
