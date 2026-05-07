import { LEAGUES } from "@/data/leagues";
import { refreshAll, refreshLeague } from "@/lib/refresh";

export const dynamic = "force-dynamic";

const leagueSet = new Set(LEAGUES.map((entry) => entry.code));

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    if (!league || league === "ALL") {
      const result = await refreshAll();
      return Response.json({ ok: true, result });
    }
    if (!leagueSet.has(league)) {
      return Response.json(
        { ok: false, error: "invalid league" },
        { status: 400 },
      );
    }
    const result = await refreshLeague({ league, from, to });
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
