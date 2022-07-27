import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import verify from "../utils/verify";
import { storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata";
import { MetadataTemplate } from "../utils/metadataInterface";

const imagesLocation = "./images/randomNft";
const TOKEN_URIS = [
  "ipfs://QmXbF79VpipbX5UayPTemtJ3488Vi38Zdjxn3r2u1TudAK",
  "ipfs://Qma5g3X1G6n2kFhRUy8oDmZ9VytTWKukqEWCe4ugJAKssk",
  "ipfs://QmYnKwSYVgQeiJjbqGormHyd2Tgkxeq6NEafzUhJ3sXEZW",
];
const FUND_AMOUNT = ethers.utils.parseEther("10");

const deployBasicNft: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deploy, log } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = network.config.chainId;
  let tokenUris: string[] = [];

  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  } else {
    tokenUris = TOKEN_URIS;
  }

  let vrfCoordinatorV2Address, subscriptionId;

  let vrfCoordinatorV2Mock;
  if (developmentChain.includes(chainId!)) {
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId!].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId!].subscriptionId;
  }
  log("-----------------------");
  const args: any[] = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId!].gasLane,
    networkConfig[chainId!].callbackGasLimit,
    tokenUris,
    networkConfig[chainId!].mintFee,
  ];

  const basicNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId!].blockConfirmations || 1,
  });

  if (developmentChain.includes(chainId!)) {
    await vrfCoordinatorV2Mock?.addConsumer(subscriptionId, basicNft.address);
  }

  if (!developmentChain.includes(chainId!) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying");
    await verify(basicNft.address, args);
  }
};

async function handleTokenUris() {
  let tokenUris: string[] = [];

  const { responses, files } = await storeImages(imagesLocation);
  for (let imageUploadResponseIndex in responses) {
    const name = files[imageUploadResponseIndex].replace(".png", "");
    let tokenUriMetadata: MetadataTemplate = {
      name: name,
      description: `An adorable ${name} pup!`,
      image: `ipfs://${responses[imageUploadResponseIndex].IpfsHash}`,
      attributes: [],
    };
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );
    tokenUris.push(`ipfs://${metadataUploadResponse?.IpfsHash}`);
  }

  return tokenUris;
}

export default deployBasicNft;
deployBasicNft.tags = ["all", "randomnft"];
