type Vec = { x: number; y: number };

type Player = {
  pos: Vec;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
};

type Enemy = {
  id: number;
  pos: Vec;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
};

type Bullet = {
  pos: Vec;
  vel: Vec;
  radius: number;
  damage: number;
  life: number;
};

type GameState = {
  width: number;
  height: number;
  time: number;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  kills: number;
  level: number;
};

type Input = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const length = (vec: Vec) => Math.hypot(vec.x, vec.y);

const normalize = (vec: Vec) => {
  const len = length(vec);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: vec.x / len, y: vec.y / len };
};

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

const randRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const createGame = () => {
  const state: GameState = {
    width: 0,
    height: 0,
    time: 0,
    player: {
      pos: { x: 0, y: 0 },
      radius: 18,
      speed: 230,
      hp: 100,
      maxHp: 100
    },
    enemies: [],
    bullets: [],
    kills: 0,
    level: 1
  };

  let enemyId = 0;
  let spawnTimer = 0;
  let fireTimer = 0;
  let xp = 0;
  let xpToLevel = 8;
  let hurtFlash = 0;

  const resize = (width: number, height: number) => {
    state.width = width;
    state.height = height;
  };

  const spawnEnemy = () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = randRange(360, 520);
    const pos = {
      x: state.player.pos.x + Math.cos(angle) * distance,
      y: state.player.pos.y + Math.sin(angle) * distance
    };
    state.enemies.push({
      id: enemyId++,
      pos,
      radius: randRange(14, 22),
      speed: randRange(70, 110),
      hp: 16 + state.level * 2,
      maxHp: 16 + state.level * 2
    });
  };

  const fireAt = (target: Enemy) => {
    const direction = normalize({
      x: target.pos.x - state.player.pos.x,
      y: target.pos.y - state.player.pos.y
    });
    state.bullets.push({
      pos: { ...state.player.pos },
      vel: { x: direction.x * 420, y: direction.y * 420 },
      radius: 4,
      damage: 10 + state.level * 2,
      life: 1.8
    });
  };

  const update = (dt: number, input: Input) => {
    state.time += dt;
    if (hurtFlash > 0) {
      hurtFlash = Math.max(0, hurtFlash - dt * 3);
    }

    const moveDir = normalize(input);
    state.player.pos.x += moveDir.x * state.player.speed * dt;
    state.player.pos.y += moveDir.y * state.player.speed * dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const waveBoost = Math.max(0.2, 1 - state.level * 0.05);
      spawnTimer = randRange(0.35, 0.75) * waveBoost;
      spawnEnemy();
    }

    fireTimer -= dt;
    if (fireTimer <= 0 && state.enemies.length > 0) {
      let nearest = state.enemies[0];
      let best = dist(state.player.pos, nearest.pos);
      for (let i = 1; i < state.enemies.length; i++) {
        const candidate = state.enemies[i];
        const d = dist(state.player.pos, candidate.pos);
        if (d < best) {
          best = d;
          nearest = candidate;
        }
      }
      fireAt(nearest);
      fireTimer = clamp(0.25 - state.level * 0.01, 0.12, 0.3);
    }

    for (const enemy of state.enemies) {
      const dir = normalize({
        x: state.player.pos.x - enemy.pos.x,
        y: state.player.pos.y - enemy.pos.y
      });
      enemy.pos.x += dir.x * enemy.speed * dt;
      enemy.pos.y += dir.y * enemy.speed * dt;
    }

    for (const bullet of state.bullets) {
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      bullet.life -= dt;
    }

    for (const enemy of state.enemies) {
      if (
        dist(enemy.pos, state.player.pos) <
        enemy.radius + state.player.radius
      ) {
        state.player.hp = Math.max(0, state.player.hp - 18 * dt);
        hurtFlash = 1;
      }
    }

    const aliveEnemies: Enemy[] = [];
    for (const enemy of state.enemies) {
      let alive = true;
      for (const bullet of state.bullets) {
        if (bullet.life <= 0) {
          continue;
        }
        if (dist(enemy.pos, bullet.pos) < enemy.radius + bullet.radius) {
          enemy.hp -= bullet.damage;
          bullet.life = 0;
          if (enemy.hp <= 0) {
            alive = false;
            state.kills += 1;
            xp += 1;
            if (xp >= xpToLevel) {
              state.level += 1;
              xp = 0;
              xpToLevel = Math.floor(xpToLevel * 1.3 + 3);
              state.player.maxHp += 6;
              state.player.hp = Math.min(
                state.player.maxHp,
                state.player.hp + 8
              );
            }
          }
          break;
        }
      }
      if (alive) {
        aliveEnemies.push(enemy);
      }
    }
    state.enemies = aliveEnemies;
    state.bullets = state.bullets.filter((bullet) => bullet.life > 0);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, offset: Vec) => {
    const step = 80;
    const startX = -((offset.x % step) + step) % step;
    const startY = -((offset.y % step) + step) % step;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = startX; x < state.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.height);
      ctx.stroke();
    }
    for (let y = startY; y < state.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
      ctx.stroke();
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "rgba(10, 10, 14, 1)";
    ctx.fillRect(0, 0, state.width, state.height);

    const camera = {
      x: state.player.pos.x - state.width / 2,
      y: state.player.pos.y - state.height / 2
    };

    drawGrid(ctx, camera);

    const worldToScreen = (pos: Vec) => ({
      x: pos.x - camera.x,
      y: pos.y - camera.y
    });

    for (const bullet of state.bullets) {
      const screen = worldToScreen(bullet.pos);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of state.enemies) {
      const screen = worldToScreen(enemy.pos);
      ctx.fillStyle = "#ff6b4a";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(
        screen.x - enemy.radius,
        screen.y - enemy.radius - 8,
        enemy.radius * 2,
        4
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(
        screen.x - enemy.radius,
        screen.y - enemy.radius - 8,
        (enemy.radius * 2 * enemy.hp) / enemy.maxHp,
        4
      );
    }

    const playerScreen = worldToScreen(state.player.pos);
    ctx.fillStyle = hurtFlash > 0 ? "#ffd7d1" : "#f2eee5";
    ctx.beginPath();
    ctx.arc(playerScreen.x, playerScreen.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(playerScreen.x, playerScreen.y, state.player.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
  };

  return {
    state,
    resize,
    update,
    render
  };
};
