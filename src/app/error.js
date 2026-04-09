"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="ko">
      <body className="app-shell">
        <div className="main-stack">
          <div className="panel">
            <h2 className="panel-title">문제가 발생했습니다</h2>
            <p className="panel-empty">
              {error?.message || "알 수 없는 오류가 발생했습니다."}
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: 16,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
