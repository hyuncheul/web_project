export default function MainLayout({
  children,
  aftergame,
  lastgame,
  team,
  player,
}) {
  return (
    <section className="main-stack">
      {children}
      <div className="panel-grid">
        <div id="aftergame">{aftergame}</div>
        <div id="lastgame">{lastgame}</div>
        <div id="team">{team}</div>
        <div id="player">{player}</div>
      </div>
    </section>
  );
}
