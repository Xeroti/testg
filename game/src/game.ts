type Vec = { x: number; y: number };

type Player = {
  pos: Vec;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
};

type Monster = {
  id: number;
  pos: Vec;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  burnTime: number;
  burnDps: number;
  xpValue: number;
  kind: "grunt" | "brute";
};

type Bullet = {
  pos: Vec;
  vel: Vec;
  radius: number;
  damage: number;
  life: number;
  mod: "none" | "piercing" | "burn" | "split" | "chain";
  pierce: number;
  chainRemaining: number;
  burnTime: number;
  burnDps: number;
};

type ExpOrb = {
  pos: Vec;
  radius: number;
  value: number;
};

type LevelChoice = {
  id: "damage" | "attackSpeed" | "moveSpeed";
  label: string;
  value: number;
};

type ModifierChoice = {
  id: "none" | "piercing" | "burn" | "split" | "chain";
  label: string;
};

type Choice = LevelChoice | ModifierChoice;

type Bonuses = {
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
};

type GameState = {
  width: number;
  height: number;
  time: number;
  player: Player;
  monsters: Monster[];
  bullets: Bullet[];
  orbs: ExpOrb[];
  choiceMode: "level" | "modifier" | null;
  choices: Choice[];
  kills: number;
  level: number;
  xp: number;
  xpToLevel: number;
  bonuses: Bonuses;
  bulletModifier: "none" | "piercing" | "burn" | "split" | "chain";
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

const rotate = (vec: Vec, radians: number) => ({
  x: vec.x * Math.cos(radians) - vec.y * Math.sin(radians),
  y: vec.x * Math.sin(radians) + vec.y * Math.cos(radians)
});

const modifierChoices: ModifierChoice[] = [
  { id: "piercing", label: "Piercing rounds" },
  { id: "burn", label: "Burning shots" },
  { id: "split", label: "Split shot" },
  { id: "chain", label: "Chain lightning" }
];

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
    monsters: [],
    bullets: [],
    orbs: [],
    choiceMode: null,
    choices: [],
    kills: 0,
    level: 1,
    xp: 0,
    xpToLevel: 8,
    bonuses: {
      damage: 0,
      attackSpeed: 0,
      moveSpeed: 0
    },
    bulletModifier: "none"
  };

  let monsterId = 0;
  let spawnTimer = 0;
  let bruteTimer = 15;
  let fireTimer = 0;
  let hurtFlash = 0;
  let swarmTriggered = false;

  const resize = (width: number, height: number) => {
    state.width = width;
    state.height = height;
  };

  const spawnMonster = (kind: "grunt" | "brute") => {
    const angle = Math.random() * Math.PI * 2;
    const distance = randRange(360, 520);
    const pos = {
      x: state.player.pos.x + Math.cos(angle) * distance,
      y: state.player.pos.y + Math.sin(angle) * distance
    };
    const isBrute = kind === "brute";
    const timeScale = 1 + state.time * 0.008;
    const levelScale = 1 + state.level * 0.06;
    const difficulty = timeScale * levelScale;
    state.monsters.push({
      id: monsterId++,
      pos,
      radius: isBrute ? randRange(34, 44) : randRange(14, 22),
      speed: (isBrute ? randRange(45, 65) : randRange(70, 110)) * (1 + state.time * 0.0025),
      hp: (isBrute ? 140 : 16) * difficulty + state.level * (isBrute ? 18 : 2),
      maxHp: (isBrute ? 140 : 16) * difficulty + state.level * (isBrute ? 18 : 2),
      burnTime: 0,
      burnDps: 0,
      xpValue: isBrute ? 6 : 1,
      kind
    });
  };

  const spawnBullet = (
    origin: Vec,
    direction: Vec,
    mod: Bullet["mod"],
    damage: number,
    chainRemaining = 0
  ) => {
    const burnTime = mod === "burn" ? 2.4 : 0;
    const burnDps = mod === "burn" ? 6 + state.level * 1.4 : 0;
    state.bullets.push({
      pos: { ...origin },
      vel: { x: direction.x * 420, y: direction.y * 420 },
      radius: 2.4,
      damage,
      life: 1.2,
      mod,
      pierce: mod === "piercing" ? 1 : 0,
      chainRemaining,
      burnTime,
      burnDps
    });
  };

  const fireAt = (target: Monster) => {
    const direction = normalize({
      x: target.pos.x - state.player.pos.x,
      y: target.pos.y - state.player.pos.y
    });
    const baseDamage = 12 + state.level * 2;
    const damage = baseDamage * (1 + state.bonuses.damage);
    const mod = state.bulletModifier;

    if (mod === "split") {
      const spread = 0.28;
      const splitDamage = damage * 0.7;
      spawnBullet(state.player.pos, direction, mod, splitDamage);
      spawnBullet(state.player.pos, rotate(direction, spread), mod, splitDamage);
      spawnBullet(state.player.pos, rotate(direction, -spread), mod, splitDamage);
      return;
    }

    if (mod === "chain") {
      spawnBullet(state.player.pos, direction, mod, damage, 2);
      return;
    }

    spawnBullet(state.player.pos, direction, mod, damage);
  };

  const setModifierChoices = () => {
    const pool = [...modifierChoices];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.choices = pool.slice(0, 3);
    state.choiceMode = "modifier";
  };

  const levelUp = () => {
    state.level += 1;
    state.xp = state.xp - state.xpToLevel;
    state.xpToLevel = Math.floor(state.xpToLevel * 1.3 + 3);
    state.player.maxHp += 6;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8);
    state.choices = [
      { id: "damage", label: "More damage", value: 0.2 },
      { id: "attackSpeed", label: "More attack speed", value: 0.18 },
      { id: "moveSpeed", label: "More move speed", value: 0.16 }
    ];
    state.choiceMode = "level";
  };

  const handleMonsterDeath = (monster: Monster) => {
    state.kills += 1;
    state.orbs.push({
      pos: { ...monster.pos },
      radius: monster.kind === "brute" ? 10 : 6,
      value: monster.xpValue
    });
    if (monster.kind === "brute") {
      if (!state.choiceMode) {
        setModifierChoices();
      }
    }
  };

  const update = (dt: number, input: Input) => {
    if (state.choiceMode) {
      return;
    }

    state.time += dt;
    if (hurtFlash > 0) {
      hurtFlash = Math.max(0, hurtFlash - dt * 3);
    }

    const moveDir = normalize(input);
    const moveSpeed = state.player.speed * (1 + state.bonuses.moveSpeed);
    state.player.pos.x += moveDir.x * moveSpeed * dt;
    state.player.pos.y += moveDir.y * moveSpeed * dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const waveBoost = Math.max(0.2, 1 - state.level * 0.05);
      const timeBoost = Math.max(0.55, 1 - state.time * 0.006);
      spawnTimer = randRange(0.35, 0.75) * waveBoost * timeBoost;
      spawnMonster("grunt");
    }

    bruteTimer -= dt;
    if (bruteTimer <= 0) {
      bruteTimer = 15;
      spawnMonster("brute");
    }

    if (!swarmTriggered && state.time >= 30) {
      swarmTriggered = true;
      for (let i = 0; i < 28; i++) {
        spawnMonster("grunt");
      }
    }

    fireTimer -= dt;
    if (fireTimer <= 0 && state.monsters.length > 0) {
      let nearest = state.monsters[0];
      let best = dist(state.player.pos, nearest.pos);
      for (let i = 1; i < state.monsters.length; i++) {
        const candidate = state.monsters[i];
        const d = dist(state.player.pos, candidate.pos);
        if (d < best) {
          best = d;
          nearest = candidate;
        }
      }
      fireAt(nearest);
      const baseDelay = clamp(0.25 - state.level * 0.01, 0.12, 0.3);
      fireTimer = baseDelay / (1 + state.bonuses.attackSpeed);
    }

    for (const monster of state.monsters) {
      const dir = normalize({
        x: state.player.pos.x - monster.pos.x,
        y: state.player.pos.y - monster.pos.y
      });
      monster.pos.x += dir.x * monster.speed * dt;
      monster.pos.y += dir.y * monster.speed * dt;
    }

    for (const bullet of state.bullets) {
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      bullet.life -= dt;
    }

    for (const monster of state.monsters) {
      if (
        dist(monster.pos, state.player.pos) <
        monster.radius + state.player.radius
      ) {
        state.player.hp = Math.max(0, state.player.hp - 18 * dt);
        hurtFlash = 1;
      }
    }

    const aliveMonsters: Monster[] = [];
    for (const monster of state.monsters) {
      let alive = true;
      if (monster.burnTime > 0) {
        monster.burnTime = Math.max(0, monster.burnTime - dt);
        monster.hp -= monster.burnDps * dt;
        if (monster.hp <= 0) {
          alive = false;
          handleMonsterDeath(monster);
        }
      }
      if (!alive) {
        continue;
      }
      for (const bullet of state.bullets) {
        if (bullet.life <= 0) {
          continue;
        }
        if (dist(monster.pos, bullet.pos) < monster.radius + bullet.radius) {
          monster.hp -= bullet.damage;
          if (bullet.mod === "burn") {
            monster.burnTime = Math.max(monster.burnTime, bullet.burnTime);
            monster.burnDps = Math.max(monster.burnDps, bullet.burnDps);
          }
          if (bullet.mod === "chain" && bullet.chainRemaining > 0) {
            let best: Monster | null = null;
            let bestDist = 220;
            for (const candidate of state.monsters) {
              if (candidate === monster) {
                continue;
              }
              const d = dist(monster.pos, candidate.pos);
              if (d < bestDist) {
                bestDist = d;
                best = candidate;
              }
            }
            if (best) {
              const dir = normalize({
                x: best.pos.x - monster.pos.x,
                y: best.pos.y - monster.pos.y
              });
              spawnBullet(
                monster.pos,
                dir,
                "chain",
                bullet.damage * 0.7,
                bullet.chainRemaining - 1
              );
            }
          }
          if (bullet.pierce > 0) {
            bullet.pierce -= 1;
          } else {
            bullet.life = 0;
          }
          if (monster.hp <= 0) {
            alive = false;
            handleMonsterDeath(monster);
          }
          break;
        }
      }
      if (alive) {
        aliveMonsters.push(monster);
      }
    }
    state.monsters = aliveMonsters;
    state.bullets = state.bullets.filter((bullet) => bullet.life > 0);

    const remainingOrbs: ExpOrb[] = [];
    for (const orb of state.orbs) {
      const distance = dist(orb.pos, state.player.pos);
      const pickupRange = state.player.radius + orb.radius + 18;
      const magnetRadius = 160;
      if (distance <= pickupRange) {
        state.xp += orb.value;
        if (state.xp >= state.xpToLevel) {
          levelUp();
        }
      } else {
        if (distance < magnetRadius) {
          const dir = normalize({
            x: state.player.pos.x - orb.pos.x,
            y: state.player.pos.y - orb.pos.y
          });
          const pull = clamp(1 - distance / magnetRadius, 0, 1);
          const pullSpeed = 140 + 320 * pull;
          orb.pos.x += dir.x * pullSpeed * dt;
          orb.pos.y += dir.y * pullSpeed * dt;
        }
        remainingOrbs.push(orb);
      }
    }
    state.orbs = remainingOrbs;

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

    for (const orb of state.orbs) {
      const screen = worldToScreen(orb.pos);
      ctx.fillStyle = "#6cf6ff";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bullet of state.bullets) {
      const screen = worldToScreen(bullet.pos);
      const trailDir = normalize(bullet.vel);
      ctx.strokeStyle = "rgba(120, 255, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y);
      ctx.lineTo(
        screen.x - trailDir.x * 18,
        screen.y - trailDir.y * 18
      );
      ctx.stroke();
    }

    for (const monster of state.monsters) {
      const screen = worldToScreen(monster.pos);
      ctx.fillStyle = monster.kind === "brute" ? "#a84df4" : "#ff6b4a";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, monster.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(
        screen.x - monster.radius,
        screen.y - monster.radius - 8,
        monster.radius * 2,
        4
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(
        screen.x - monster.radius,
        screen.y - monster.radius - 8,
        (monster.radius * 2 * monster.hp) / monster.maxHp,
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
    render,
    choosePowerup: (index: number) => {
      const choice = state.choices[index];
      if (!choice) {
        return;
      }
      if (state.choiceMode === "level") {
        const levelChoice = choice as LevelChoice;
        if (levelChoice.id === "damage") {
          state.bonuses.damage += levelChoice.value;
        }
        if (levelChoice.id === "attackSpeed") {
          state.bonuses.attackSpeed += levelChoice.value;
        }
        if (levelChoice.id === "moveSpeed") {
          state.bonuses.moveSpeed += levelChoice.value;
        }
      } else if (state.choiceMode === "modifier") {
        const modChoice = choice as ModifierChoice;
        state.bulletModifier = modChoice.id;
      }
      state.choices = [];
      state.choiceMode = null;
    }
  };
};
