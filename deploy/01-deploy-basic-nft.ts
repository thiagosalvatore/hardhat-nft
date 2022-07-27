import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { network } from "hardhat";
import verify from "../utils/verify";

const deployBasicNft: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deploy, log } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = network.config.chainId;

  const args: any[] = [];
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId!].blockConfirmations || 1,
  });

  if (!developmentChain.includes(chainId!) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(basicNft.address, args);
  }
};

export default deployBasicNft;
deployBasicNft.tags = ["all", "basicnft"];
