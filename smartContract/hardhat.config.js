require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10_000_000,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },

  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC,
      },
    },

    sepolia: {
      chainId: 11155111,
      url: process.env.RPC,
      accounts: [process.env.PK],
    },
  },
};
