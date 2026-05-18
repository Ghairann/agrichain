require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: (() => {
        const raw = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");
        return /^[0-9a-fA-F]{64}$/.test(raw) ? [`0x${raw}`] : [];
      })(),
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
