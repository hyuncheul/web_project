import { LEAGUES } from "@/data/leagues";
import { getStandingsByLeague } from "@/lib/queries";
import StandingsPanel from "@/components/panels/standings-panel";

export const dynamic = "force-dynamic";

export default async function TeamSlot() {
  const grouped = await getStandingsByLeague();
  return <StandingsPanel leagues={LEAGUES} data={grouped} />;
}
