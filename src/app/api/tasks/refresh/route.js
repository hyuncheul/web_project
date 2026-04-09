import { leagueSet } from "@/lib/db";
import { refreshLeague } from "@/lib/refresh";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (!league || !leagueSet.has(league)) {
    return Response.json({ ok: false, error: "invalid league" }, { status: 400 });
  }

  const result = await refreshLeague({ league, from, to });
  return Response.json({ ok: true, result });
}
