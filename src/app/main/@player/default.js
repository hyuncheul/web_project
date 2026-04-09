export default function PlayerFallback() {
  return (
    <section className="panel">
      <div className="panel-header">
        <p className="panel-title">리그 득점 선수</p>
      </div>
      <p className="panel-empty">
        득점 데이터를 수집 중입니다.
      </p>
    </section>
  );
}
