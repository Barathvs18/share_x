// scripts/deploy.js
// Run with: npx hardhat run scripts/deploy.js --network localhost

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying SecureFileShare contract to local Hardhat node...\n");

    // Get the contract factory
    const SecureFileShare = await ethers.getContractFactory("SecureFileShare");

    // Deploy the contract (uses account[0] from hardhat node by default)
    const contract = await SecureFileShare.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    console.log("✅ Contract deployed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Contract Address : ${contractAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n👉 NEXT STEP:");
    console.log(`   Open frontend/src/services/web3.js`);
    console.log(`   Replace CONTRACT_ADDRESS with: "${contractAddress}"\n`);

    // ─── Auto-save the address to a local JSON file for easy reference ───
    const deployInfo = {
        contractAddress,
        network: "localhost",
        deployedAt: new Date().toISOString(),
        rpcUrl: "http://127.0.0.1:8545",
    };

    const outPath = path.join(__dirname, "..", "deployed.json");
    fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
    console.log(`💾 Saved deployment info to: deployed.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
