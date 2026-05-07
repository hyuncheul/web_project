import { LEAGUES } from "@/data/leagues";
import { getUpcomingMatchesByLeague } from "@/lib/queries";
import UpcomingPanel from "@/components/panels/upcoming-panel";

export const dynamic = "force-dynamic";

export default async function AftergameSlot() {
  const grouped = await getUpcomingMatchesByLeague();
  return <UpcomingPanel leagues={LEAGUES} data={grouped} />;
}
