export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;
export const FACTORY_MISSING_MSG = "Factory not deployed yet — set NEXT_PUBLIC_FACTORY_ADDRESS";

export const gameFactoryAbi = [
  {
    type: "function", name: "createGame", stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" }, { name: "symbol", type: "string" },
      { name: "gameId", type: "string" }, { name: "playFee", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function", name: "setPlayFee", stateMutability: "nonpayable",
    inputs: [{ name: "token", type: "address" }, { name: "fee", type: "uint256" }], outputs: [],
  },
  {
    type: "function", name: "payToPlay", stateMutability: "payable",
    inputs: [{ name: "token", type: "address" }], outputs: [],
  },
  {
    type: "function", name: "reward", stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" }, { name: "player", type: "address" }, { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "games", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "creator", type: "address" }, { name: "gameId", type: "string" },
      { name: "playFee", type: "uint256" }, { name: "plays", type: "uint256" }, { name: "exists", type: "bool" },
    ],
  },
  {
    type: "function", name: "tokenByGameId", stateMutability: "view",
    inputs: [{ name: "", type: "string" }], outputs: [{ name: "", type: "address" }],
  },
  { type: "function", name: "allGames", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { type: "function", name: "gamesCount", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "rewarder", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  {
    type: "event", name: "GameCreated", anonymous: false,
    inputs: [
      { name: "token", type: "address", indexed: true }, { name: "creator", type: "address", indexed: true },
      { name: "gameId", type: "string", indexed: false }, { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false }, { name: "playFee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "Played", anonymous: false,
    inputs: [
      { name: "token", type: "address", indexed: true }, { name: "player", type: "address", indexed: true },
      { name: "paid", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "Rewarded", anonymous: false,
    inputs: [
      { name: "token", type: "address", indexed: true }, { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const gameTokenAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;
