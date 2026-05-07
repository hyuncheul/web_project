import { LEAGUES } from "@/data/leagues";
import { prisma } from "./prisma";
import {
  FINISHED_STATUS,
  UPCOMING_STATUSES,
  toPanelMatch,
  toPanelScorer,
  toPanelStanding,
} from "./transform";

const LEAGUE_CODES = LEAGUES.map((league) => league.code);

function emptyMap() {
  const grouped = {};
  for (const code of LEAGUE_CODES) {
    grouped[code] = [];
  }
  return grouped;
}

function groupBy(rows, key, transform) {
  const grouped = emptyMap();
  for (const row of rows) {
    const code = row[key];
    if (!code) continue;
    if (!grouped[code]) grouped[code] = [];
    const mapped = transform(row);
    if (mapped) grouped[code].push(mapped);
  }
  return grouped;
}

export async function getUpcomingMatchesByLeague() {
  const rows = await prisma.match.findMany({
    where: { status: { in: UPCOMING_STATUSES } },
    orderBy: { utcDate: "asc" },
  });
  return groupBy(rows, "leagueCode", toPanelMatch);
}

export async function getFinishedMatchesByLeague() {
  const rows = await prisma.match.findMany({
    where: { status: FINISHED_STATUS },
    orderBy: { utcDate: "desc" },
  });
  return groupBy(rows, "leagueCode", toPanelMatch);
}

export async function getStandingsByLeague() {
  const rows = await prisma.standing.findMany({
    orderBy: [{ leagueCode: "asc" }, { position: "asc" }],
  });
  return groupBy(rows, "leagueCode", toPanelStanding);
}

export async function getScorersByLeague() {
  const rows = await prisma.scorer.findMany({
    orderBy: [{ leagueCode: "asc" }, { rank: "asc" }],
  });
  return groupBy(rows, "leagueCode", toPanelScorer);
}

export async function getDashboardSummary() {
  const [upcoming, finished, standings, scorers, latest] = await Promise.all([
    prisma.match.count({ where: { status: { in: UPCOMING_STATUSES } } }),
    prisma.match.count({ where: { status: FINISHED_STATUS } }),
    prisma.standing.count(),
    prisma.scorer.count(),
    prisma.match.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);
  return {
    upcoming,
    finished,
    standings,
    scorers,
    updatedAt: latest?.updatedAt?.toISOString() ?? null,
    leagues: LEAGUE_CODES.length,
  };
}
