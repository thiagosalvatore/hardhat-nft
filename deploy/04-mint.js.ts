import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import deployBasicNft from "./02-deploy-random-ipfs-nft";
const mintNfts: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const chainId = network.config.chainId;

  const basicNft = await ethers.getContract("BasicNft", deployer);
  const basicMintTx = await basicNft.mintNft();
  await basicMintTx.wait(1);
  console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`);

  const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
  const mintFee = await randomIpfsNft.getMintFee();
  const randomIpfsNftTx = await randomIpfsNft.requestNft({
    value: mintFee.toString(),
  });
  const randomIpfsNftTxReceipt = await randomIpfsNftTx.wait(1);
  await new Promise<void>(async (resolve, reject) => {
    setTimeout(resolve, 300000);
    randomIpfsNft.once("NftMinted", async () => {
      resolve();
    });
    if (developmentChain.includes(chainId!)) {
      const requestId = randomIpfsNftTxReceipt.events[1].args.requestId;
      const vrfCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
      );
      await vrfCoordinatorV2Mock.fulfillRandomWords(
        requestId,
        randomIpfsNft.address
      );
      console.log(
        `Random NFT index 0 has tokenURI: ${await randomIpfsNft.tokenURI(0)}`
      );
    }

    const highValue = await ethers.utils.parseEther("4000");
    const dynamicNft = await ethers.getContract("DynamicSvgNft", deployer);
    const dynamicNftTx = await dynamicNft.mintNft(highValue.toString());
    await dynamicNftTx.wait(1);
    console.log(
      `Dynamic NFT index 0 has tokenURI: ${await dynamicNft.tokenURI(0)}`
    );
  });
};

export default mintNfts;
mintNfts.tags = ["all", "mint"];
