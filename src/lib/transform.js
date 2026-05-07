// Football-data.org 응답을 Prisma 모델 친화적인 평면 구조로 변환하는 함수 모음.
// 여기서 만든 객체는 그대로 prisma upsert의 create/update 데이터로 쓸 수 있다.

function toIntOrNull(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toIntOrZero(value) {
  return toIntOrNull(value) ?? 0;
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveSeasonLabel(payload) {
  const start = payload?.season?.startDate;
  const end = payload?.season?.endDate;
  if (typeof start === "string" && start.length >= 4) return start.slice(0, 4);
  if (typeof end === "string" && end.length >= 4) return end.slice(0, 4);
  return new Date().getUTCFullYear().toString();
}

export function mapMatch(match, leagueCode, seasonLabel) {
  if (!match?.id) return null;
  const home = match.homeTeam;
  const away = match.awayTeam;
  if (!home?.id || !away?.id) return null;
  if (!home?.name || !away?.name) return null;

  const utcDate = toDateOrNull(match.utcDate);
  if (!utcDate || !match.status) return null;

  const fullTime = match.score?.fullTime ?? {};

  return {
    apiMatchId: match.id,
    leagueCode,
    season: seasonLabel,
    utcDate,
    status: match.status,
    matchday: toIntOrNull(match.matchday),
    homeTeamId: home.id,
    homeTeamName: home.name,
    homeCrest: home.crest ?? null,
    awayTeamId: away.id,
    awayTeamName: away.name,
    awayCrest: away.crest ?? null,
    fulltimeHome: toIntOrNull(fullTime.home),
    fulltimeAway: toIntOrNull(fullTime.away),
    lastUpdated: toDateOrNull(match.lastUpdated),
  };
}

export function mapStandingRow(row, leagueCode, seasonLabel) {
  if (!row?.team?.id) return null;
  return {
    leagueCode,
    season: seasonLabel,
    position: toIntOrZero(row.position),
    teamId: row.team.id,
    teamName: row.team.name ?? "",
    crest: row.team.crest ?? null,
    played: toIntOrZero(row.playedGames),
    won: toIntOrZero(row.won),
    draw: toIntOrZero(row.draw),
    lost: toIntOrZero(row.lost),
    goalsFor: toIntOrZero(row.goalsFor),
    goalsAgainst: toIntOrZero(row.goalsAgainst),
    goalDifference: toIntOrZero(row.goalDifference),
    points: toIntOrZero(row.points),
  };
}

export function mapScorer(entry, index, leagueCode, seasonLabel) {
  if (!entry?.player?.id) return null;
  return {
    leagueCode,
    season: seasonLabel,
    rank: toIntOrNull(entry.rank) ?? index + 1,
    playerId: entry.player.id,
    playerName: entry.player.name ?? "",
    teamId: entry.team?.id ?? null,
    teamName: entry.team?.name ?? null,
    goals: toIntOrZero(entry.goals),
    assists: toIntOrNull(entry.assists),
    penalties: toIntOrNull(entry.penalties),
    playedMatches: toIntOrNull(entry.playedMatches),
  };
}

export function splitMatches(matches) {
  const upcoming = [];
  const finished = [];
  for (const match of matches) {
    if (match.status === "FINISHED") {
      finished.push(match);
    } else {
      upcoming.push(match);
    }
  }
  return { upcomingMatches: upcoming, finishedMatches: finished };
}

export const UPCOMING_STATUSES = ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"];
export const FINISHED_STATUS = "FINISHED";

// 평면 DB row → 기존 패널 컴포넌트가 기대하는 중첩 구조로 변환
export function toPanelMatch(row) {
  if (!row) return null;
  return {
    id: row.apiMatchId,
    leagueCode: row.leagueCode,
    utcDate:
      row.utcDate instanceof Date ? row.utcDate.toISOString() : row.utcDate,
    status: row.status,
    matchday: row.matchday ?? 0,
    home: {
      id: row.homeTeamId,
      name: row.homeTeamName,
      crest: row.homeCrest ?? "",
    },
    away: {
      id: row.awayTeamId,
      name: row.awayTeamName,
      crest: row.awayCrest ?? "",
    },
    score: {
      ftH: row.fulltimeHome ?? null,
      ftA: row.fulltimeAway ?? null,
    },
  };
}

export function toPanelStanding(row) {
  if (!row) return null;
  return {
    leagueCode: row.leagueCode,
    season: row.season,
    position: row.position,
    teamId: row.teamId,
    teamName: row.teamName,
    crest: row.crest ?? "",
    played: row.played,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    gf: row.goalsFor,
    ga: row.goalsAgainst,
    gd: row.goalDifference,
    points: row.points,
  };
}

export function toPanelScorer(row) {
  if (!row) return null;
  return {
    leagueCode: row.leagueCode,
    season: row.season,
    rank: row.rank,
    playerId: row.playerId,
    playerName: row.playerName,
    teamId: row.teamId,
    teamName: row.teamName ?? "",
    goals: row.goals,
    points: row.goals, // 기존 패널이 row.goals ?? row.points 패턴을 사용해서 호환을 위해 같이 노출
  };
}
