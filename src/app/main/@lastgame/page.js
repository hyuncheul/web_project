import { LEAGUES } from "@/data/leagues";
import { getFinishedMatchesByLeague } from "@/lib/queries";
import FinishedPanel from "@/components/panels/finished-panel";

export const dynamic = "force-dynamic";

export default async function LastgameSlot() {
  const grouped = await getFinishedMatchesByLeague();
  return <FinishedPanel leagues={LEAGUES} data={grouped} />;
}
