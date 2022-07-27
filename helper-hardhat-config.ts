import { ethers } from "hardhat";

export const chainIdMapping = {
  rinkeby: 4,
  hardhat: 31337,
  localhost: 31337,
};

export const developmentChain = [
  chainIdMapping.hardhat,
  chainIdMapping.localhost,
];

export const networkConfig = {
  [chainIdMapping.rinkeby]: {
    name: "rinkeby",
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    blockConfirmations: 6,
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "9146",
    callbackGasLimit: "500000",
    interval: "30",
    mintFee: "10000000000000000",
  },
  [chainIdMapping.hardhat]: {
    name: "hardhat",
    blockConfirmations: 1,
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: "500000",
    interval: "30",
    mintFee: "10000000000000000",
  },
  [chainIdMapping.localhost]: {
    name: "hardhat",
    blockConfirmations: 1,
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: "500000",
    interval: "30",
    mintFee: "10000000000000000",
  },
};
