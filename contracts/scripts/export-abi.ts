import { artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const outDir = path.join(__dirname, "..", "..", "src", "lib", "abi");
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of ["GameFactory", "GameToken"]) {
    const artifact = await artifacts.readArtifact(name);
    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(artifact.abi, null, 2) + "\n");
    console.log(`Exported ${name} ABI -> ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
