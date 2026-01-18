export default function HomePage() {
  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Game Loop Foundation</p>
          <h1>Survive the horde. Build fast.</h1>
          <p className="lead">
            This workspace splits the marketing site (Next.js) from the live
            game loop (Vite + canvas) for rapid iteration. Start the game server
            and iterate on the core feel before adding content.
          </p>
          <div className="cta-row">
            <a className="cta" href="http://localhost:5173">
              Open the Game
            </a>
            <a className="cta ghost" href="#milestones">
              Read the Plan
            </a>
          </div>
        </div>
        <div className="card">
          <h3>Dev Servers</h3>
          <div className="meta">
            <span>Next.js</span>
            <strong>http://localhost:3000</strong>
          </div>
          <div className="meta">
            <span>Vite Game</span>
            <strong>http://localhost:5173</strong>
          </div>
          <p className="note">
            Run both in parallel, then evolve the Vite build into a static asset
            or iframe for production.
          </p>
        </div>
      </header>

      <section id="milestones" className="grid">
        <div className="panel">
          <h3>Core Loop</h3>
          <ul>
            <li>Spawn enemies in waves.</li>
            <li>Auto-target the nearest foe.</li>
            <li>Collect XP and scale over time.</li>
          </ul>
        </div>
        <div className="panel">
          <h3>Feel First</h3>
          <ul>
            <li>Camera follow and parallax ground.</li>
            <li>Juice with hit flashes and shake.</li>
            <li>Readable damage numbers.</li>
          </ul>
        </div>
        <div className="panel">
          <h3>Next Milestones</h3>
          <ul>
            <li>Level-up choices.</li>
            <li>Passive upgrades and weapons.</li>
            <li>Boss timers and event waves.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
