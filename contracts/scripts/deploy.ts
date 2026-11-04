import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account. Set PRIVATE_KEY in contracts/.env");
  }
  const rewarder = process.env.REWARDER_ADDRESS || deployer.address;
  const { chainId } = await ethers.provider.getNetwork();

  console.log(`Network: ${network.name} (chainId ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MON`);
  console.log(`Rewarder: ${rewarder}`);

  const factory = await ethers.deployContract("GameFactory", [rewarder]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  const txHash = factory.deploymentTransaction()?.hash ?? "";
  console.log(`GameFactory deployed at: ${factoryAddress}`);
  console.log(`Tx: ${txHash}`);

  const deployment: Record<string, unknown> = {
    factory: factoryAddress,
    rewarder,
    chainId: Number(chainId),
    deployer: deployer.address,
    txHash,
    timestamp: new Date().toISOString(),
  };

  if (process.env.DEMO === "1") {
    console.log("Creating demo game 'demo-flappy'...");
    const tx = await factory.createGame("Flappy Monad", "FLAP", "demo-flappy", 0);
    await tx.wait();
    const demoToken = await factory.tokenByGameId("demo-flappy");
    console.log(`Demo game token: ${demoToken}`);
    deployment.demoGame = { gameId: "demo-flappy", token: demoToken, txHash: tx.hash };
  }

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2) + "\n");
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
