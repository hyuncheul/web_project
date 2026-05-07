import { LEAGUES } from "@/data/leagues";
import { getScorersByLeague } from "@/lib/queries";
import ScorersPanel from "@/components/panels/scorers-panel";

export const dynamic = "force-dynamic";

export default async function PlayerSlot() {
  const grouped = await getScorersByLeague();
  return <ScorersPanel leagues={LEAGUES} data={grouped} />;
}
