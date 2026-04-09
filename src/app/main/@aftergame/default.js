export default function AftergameFallback() {
  return (
    <section className="panel">
      <div className="panel-header">
        <p className="panel-title">예정 경기</p>
      </div>
      <p className="panel-empty">
        데이터를 불러오는 중입니다.
      </p>
    </section>
  );
}
