module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,          // Ganache GUI default (8545 for Ganache CLI)
      network_id: "*",
    },
    sepolia: {
      provider: () => {
        const HDWalletProvider = require("@truffle/hdwallet-provider");
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
        );
      },
      network_id: 11155111,
      gas: 4500000,
      gasPrice: 10000000000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",    // Changed from 0.8.24 to 0.8.19 for better Ganache compatibility
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"  // Explicitly set EVM version
      }
    },
  },
};
