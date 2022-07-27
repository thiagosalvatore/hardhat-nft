import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import * as fs from "fs";

const deployBasicNft: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deploy, log } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = network.config.chainId;

  let ethUsdPriceFeedAddress;

  if (developmentChain.includes(chainId!)) {
    const aggregatorMock = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = aggregatorMock.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId!].ethUsdPriceFeed;
  }

  const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", {
    encoding: "utf-8",
  });
  const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", {
    encoding: "utf-8",
  });

  const args: any[] = [ethUsdPriceFeedAddress, lowSVG, highSVG];
  const dynamicNft = await deploy("DynamicSvgNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId!].blockConfirmations || 1,
  });

  if (!developmentChain.includes(chainId!) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(dynamicNft.address, args);
  }
};

export default deployBasicNft;
deployBasicNft.tags = ["all", "dynamicnft"];
