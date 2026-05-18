const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function updateFrontendEnv(address) {
  const envPath = path.join(__dirname, "../frontend/.env.local");
  const line = `VITE_CONTRACT_ADDRESS=${address}\n`;

  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, "utf8");
    if (/VITE_CONTRACT_ADDRESS=/.test(content)) {
      content = content.replace(/VITE_CONTRACT_ADDRESS=.*/g, `VITE_CONTRACT_ADDRESS=${address}`);
    } else {
      content += line;
    }
    fs.writeFileSync(envPath, content);
  } else {
    fs.writeFileSync(envPath, line);
  }
  console.log("✅ frontend/.env.local updated with:", address);
}

async function main() {
  console.log("=====================================================");
  console.log("  AgriChain — Sepolia Testnet Deployment");
  console.log("=====================================================\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer :", deployer.address);
  console.log("Balance  :", ethers.formatEther(balance), "ETH");
  console.log("Network  : Sepolia (chainId 11155111)\n");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Saldo ETH tidak cukup. Minimal 0.01 ETH diperlukan untuk deploy.");
  }

  console.log("Deploying AgriChain contract...");
  const AgriChain = await ethers.getContractFactory("AgriChain");
  const contract = await AgriChain.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("   Address :", addr);
  console.log("   Explorer: https://sepolia.etherscan.io/address/" + addr);

  await updateFrontendEnv(addr);

  console.log("\n=====================================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("=====================================================");
  console.log("Contract Address :", addr);
  console.log("\nFrontend .env.local has been updated automatically.");
  console.log("Start the frontend with: cd frontend && npm run dev");

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying contract on Etherscan...");
    try {
      const { run } = require("hardhat");
      await run("verify:verify", { address: addr, constructorArguments: [] });
      console.log("✅ Contract verified on Etherscan");
    } catch (e) {
      console.log("⚠️  Etherscan verification skipped:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err.message || err);
    process.exit(1);
  });
