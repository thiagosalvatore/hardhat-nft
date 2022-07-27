import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "dotenv/config";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.9" }, { version: "0.6.6" }],
  },
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.RINKEBY_PRIVATE_KEY!],
      chainId: 4,
    },
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY!,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // index of the account in the list of accounts for each network. We can use the key as the chainId to have different indexes for different chains
    },
  },
};

export default config;
