import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();
  
  const contractAddress = await voting.getAddress();

  console.log("Voting contract deployed to:", contractAddress);

  // Path to frontend src
  // We are in scripts/ so .. is voting-dapp/
  // frontend is inside voting-dapp/
  const frontendSrcDir = path.join(__dirname, "..", "frontend", "src");

  if (!fs.existsSync(frontendSrcDir)) {
    fs.mkdirSync(frontendSrcDir, { recursive: true });
  }

  // Save ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "Voting.sol", "Voting.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiDest = path.join(frontendSrcDir, "abi.json");
  fs.writeFileSync(abiDest, JSON.stringify(artifact.abi, null, 2));
  console.log(`ABI saved to ${abiDest}`);

  // Save Config (Address)
  const configDest = path.join(frontendSrcDir, "contract-config.json");
  fs.writeFileSync(configDest, JSON.stringify({ address: contractAddress }, null, 2));
  console.log(`Config saved to ${configDest}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
