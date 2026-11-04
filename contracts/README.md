# MonadGames Contracts

Hardhat project for the MonadGames platform: `GameFactory` deploys one `GameToken` (ERC20) per AI-generated mini-game, collects play fees (90% creator / 10% platform), and mints token rewards to players via a trusted rewarder.

## Install

```bash
cd contracts
npm install
```

## Compile & test

```bash
npm run compile
npm test
```

## Export ABIs to the frontend

Writes `../src/lib/abi/GameFactory.json` and `../src/lib/abi/GameToken.json`:

```bash
npm run export-abi
```

## Deploy to Monad testnet (chainId 10143)

```bash
cp .env.sample .env
# edit .env:
#   PRIVATE_KEY=0x...          deployer key (funded with testnet MON)
#   REWARDER_ADDRESS=0x...     optional, defaults to deployer
#   MONAD_RPC_URL=...          optional, defaults to https://testnet-rpc.monad.xyz
npm run deploy:monad
# also create a demo game ("demo-flappy" / Flappy Monad / FLAP, fee 0):
DEMO=1 npm run deploy:monad
```

The deployment is recorded in `deployments/monadTestnet.json`
(`factory`, `rewarder`, `chainId`, `deployer`, `txHash`, `timestamp`).
