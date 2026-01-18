# Vampire Survivors-like Foundation (Next.js + Vite)

This repo contains two apps:
- `web/`: Next.js site (landing + dev notes)
- `game/`: Vite + TypeScript canvas game loop foundation

## Quick start

1) Install dependencies in each folder:
```
cd web
npm install
cd ../game
npm install
```

2) Run both in separate terminals:
```
cd web
npm run dev
```

```
cd game
npm run dev
```

Open:
- Next.js site: http://localhost:3000
- Vite game: http://localhost:5173

## Why two apps
Next.js doesn't use Vite under the hood. Keeping them separate lets you build a marketing site in Next while iterating the game loop with Vite's fast canvas reloads. You can later embed the Vite build into Next (iframe or export + static hosting).
