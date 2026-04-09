export const leagueLabel = {
  PL: "프리미어리그",
  PD: "라리가",
  SA: "세리에 A",
  BL1: "분데스리가",
  FL1: "리그 1",
  CL: "챔피언스리그",
};

export function getLeagueLabel(code) {
  return leagueLabel[code] || code;
}
