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
const joystickEl = document.getElementById("joystick");
const joystickStick = document.getElementById("joystick-stick");

const game = createGame();

const keys = new Set<string>();
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

const touch = {
  x: 0,
  y: 0,
  active: false,
  pointerId: -1
};

const updateJoystick = (dx: number, dy: number, radius: number) => {
  const dist = Math.hypot(dx, dy);
  const clamped = dist > radius ? radius / dist : 1;
  const nx = dx * clamped;
  const ny = dy * clamped;
  touch.x = radius ? nx / radius : 0;
  touch.y = radius ? ny / radius : 0;
  if (joystickStick) {
    joystickStick.style.transform = `translate(${nx}px, ${ny}px)`;
  }
};

const resetJoystick = () => {
  touch.x = 0;
  touch.y = 0;
  touch.active = false;
  touch.pointerId = -1;
  if (joystickStick) {
    joystickStick.style.transform = "translate(0, 0)";
  }
};

if (joystickEl) {
  const getCenter = () => {
    const rect = joystickEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: rect.width * 0.5 - 8
    };
  };

  joystickEl.addEventListener("pointerdown", (event) => {
    joystickEl.setPointerCapture(event.pointerId);
    touch.active = true;
    touch.pointerId = event.pointerId;
    const center = getCenter();
    updateJoystick(event.clientX - center.x, event.clientY - center.y, center.radius);
  });

  joystickEl.addEventListener("pointermove", (event) => {
    if (!touch.active || event.pointerId !== touch.pointerId) {
      return;
    }
    const center = getCenter();
    updateJoystick(event.clientX - center.x, event.clientY - center.y, center.radius);
  });

  const endPointer = (event: PointerEvent) => {
    if (event.pointerId !== touch.pointerId) {
      return;
    }
    resetJoystick();
  };

  joystickEl.addEventListener("pointerup", endPointer);
  joystickEl.addEventListener("pointercancel", endPointer);
  joystickEl.addEventListener("lostpointercapture", resetJoystick);
}

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
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
      touch.x,
    y:
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) +
      touch.y
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
