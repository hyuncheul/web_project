import { LEAGUES } from "@/data/leagues";
import { readDb } from "@/lib/db";
import StandingsPanel from "@/components/panels/standings-panel";
import { groupByLeague } from "@/lib/group-by-league";

export const dynamic = "force-dynamic";

export default async function TeamSlot() {
  const db = await readDb();
  const grouped = groupByLeague(
    db.standings ?? [],
    (a, b) => a.position - b.position,
  );
  return <StandingsPanel leagues={LEAGUES} data={grouped} />;
}
