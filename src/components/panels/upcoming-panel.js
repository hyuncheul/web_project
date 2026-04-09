"use client";

import { useState } from "react";
import { getLeagueLabel } from "@/lib/league-label";
import { formatKST } from "@/lib/time";

const LIMIT = 5;

export default function UpcomingPanel({ leagues, data }) {
  const fallback = leagues[0]?.code ?? "";
  const [active, setActive] = useState(fallback);
  const [expanded, setExpanded] = useState(false);

  const list = data[active] ?? [];
  const displayList = expanded ? list : list.slice(0, LIMIT);
  const hasMore = list.length > LIMIT;

  const handleTab = (code) => {
    setActive(code);
    setExpanded(false);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <p className="panel-title">예정 경기</p>
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
      {displayList.length === 0 ? (
        <p className="panel-empty">등록된 일정이 없습니다.</p>
      ) : (
        <ul className="match-list">
          {displayList.map((match) => (
            <li key={match.id} className="match-row">
              <div className="match-row-head">
                <span>Matchday {match.matchday ?? "-"}</span>
                <span className="match-time">{formatKST(match.utcDate)}</span>
              </div>
              <div className="match-row-body">
                <span className="team-chip">{match.home?.name ?? "-"}</span>
                <span>vs</span>
                <span className="team-chip">{match.away?.name ?? "-"}</span>
              </div>
            </li>
          ))}
        </ul>
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
