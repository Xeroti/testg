import "./styles.css";
import { createGame } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas not supported");
}

const hpEl = document.getElementById("hp");
const killsEl = document.getElementById("kills");
const levelEl = document.getElementById("level");

const game = createGame();

const keys = new Set<string>();
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

const resize = () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.resize(window.innerWidth, window.innerHeight);
};

resize();
window.addEventListener("resize", resize);

let last = performance.now();
const loop = (now: number) => {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  const input = {
    x:
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
    y:
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      (keys.has("w") || keys.has("arrowup") ? 1 : 0)
  };

  game.update(dt, input);
  game.render(ctx);

  if (hpEl) {
    hpEl.textContent = `${Math.max(0, Math.floor(game.state.player.hp))}`;
  }
  if (killsEl) {
    killsEl.textContent = `${game.state.kills}`;
  }
  if (levelEl) {
    levelEl.textContent = `${game.state.level}`;
  }

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
