"use client";

import { useState } from "react";
import { getLeagueLabel } from "@/lib/league-label";

const LIMIT = 10;

export default function ScorersPanel({ leagues, data }) {
  const initial = leagues[0]?.code ?? "";
  const [active, setActive] = useState(initial);
  const [expanded, setExpanded] = useState(false);

  const rows = data[active] ?? [];
  const displayRows = expanded ? rows : rows.slice(0, LIMIT);
  const hasMore = rows.length > LIMIT;

  const handleTab = (code) => {
    setActive(code);
    setExpanded(false);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <p className="panel-title">리그 득점 선수</p>
        <span className="panel-meta">{getLeagueLabel(active)}</span>
      </div>
      <div className="tab-strip">
        {leagues.map((league) => (
          <button
            key={league.code}
            type="button"
            className={`tab-button${league.code === active ? " is-active" : ""}`}
            onClick={() => handleTab(league.code)}
          >
            {league.name}
          </button>
        ))}
      </div>
      {expanded && (
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setExpanded(false)}
        >
          닫기
        </button>
      )}
      {displayRows.length === 0 ? (
        <p className="panel-empty">득점 데이터가 없습니다.</p>
      ) : (
        <div className="panel-table-wrapper">
          <table className="panel-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>선수</th>
                <th>팀</th>
                <th>득점</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={`${row.leagueCode}-${row.playerId}`}>
                  <td>{row.rank}</td>
                  <td>
                    <div className="player-name">{row.playerName}</div>
                    <div className="player-team">{row.season} 시즌</div>
                  </td>
                  <td>{row.teamName}</td>
                  <td>{row.goals ?? row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          className="panel-more"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </section>
  );
}
