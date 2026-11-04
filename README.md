# 🎮 MonadGames

**Lovable for onchain mini-games — on Monad.** Type an idea, no matter how weird, and it spins up into a playable mini-game with its own token on Monad testnet. Creators earn through pay-to-play fees and token economies; players earn tokens for their scores.

## How it works

1. **Prompt → template.** Your idea is matched against a registry of 10 core game templates (flappy, tap, snake, runner, racer, shooter, memory, sliding puzzle, word guess, catcher).
2. **AI customization.** If `TOGETHER_API_KEY` is set, Qwen (via Together AI) themes the template's config (title, colors, emojis, speed, token symbol). Without a key, a heuristic customizer is used, so the app works offline.
3. **Sandboxed play.** Games run in an `<iframe sandbox="allow-scripts">` (no same-origin), so a crashing game can't touch the app. Scores leave the sandbox over a `postMessage` bridge (`src/lib/bridge.ts`).
4. **Onchain economy.** `GameFactory` on Monad deploys an ERC20 per game (1M supply to the creator), handles pay-to-play in MON (90% creator / 10% platform), and mints score rewards to players via a server-side rewarder (`/api/reward`).

```
prompt ─▶ matcher ─▶ template + (Qwen config) ─▶ HTML game ─▶ sandboxed iframe
                                                                 │ postMessage(score)
                                       GameFactory.reward ◀── /api/reward
creator ─▶ GameFactory.createGame ─▶ GameToken (ERC20)    player ─▶ payToPlay (MON)
```

## Run locally

```bash
npm install
cp .env.sample .env.local   # fill in values
npm run dev
```

## Deploy contracts to Monad testnet

```bash
cd contracts
npm install
cp .env.sample .env         # PRIVATE_KEY of 0xC07d95248860eD400A3964154e9169903Cbfa8ce
npm test
npm run deploy:monad
```

Then put the printed factory address into `.env.local` as `NEXT_PUBLIC_FACTORY_ADDRESS`, and set `REWARDER_PRIVATE_KEY` (the deployer key by default — it's the factory's rewarder).

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| Monad Testnet | 10143 | https://testnet-rpc.monad.xyz | https://testnet.monadexplorer.com |

## Structure

- `contracts/` — Hardhat project: `GameFactory.sol`, `GameToken.sol`, tests, deploy script
- `src/games/templates/` — self-contained HTML game templates
- `src/lib/matcher.ts`, `src/lib/generate.ts` — prompt → game pipeline
- `src/lib/store.ts` — JSON file store (`.data/games.json`)
- `src/app/` — Next.js pages (`/`, `/create`, `/game/[id]`, `/my`) and API routes
