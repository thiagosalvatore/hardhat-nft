import { Address } from "hardhat-deploy/dist/types";
import { Contract } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { assert } from "chai";

describe("BasicNFT", () => {
  let basicNFT: Contract;
  let deployer: Address;

  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    basicNFT = await ethers.getContract("BasicNft", deployer);
  });

  it("should initialize the counter as zero", async () => {
    const counter = await basicNFT.getTokenCounter();
    assert.equal(counter.toString(), "0");
  });

  it("should return the static tokenURI", async () => {
    const expectedToken = await basicNFT.TOKEN_URI();

    const tokenURI = await basicNFT.tokenURI(0);

    assert.equal(expectedToken, tokenURI);
  });

  describe("when user mints an NFT", () => {
    it("should increase the token counter", async () => {
      const previousCounter = await basicNFT.getTokenCounter();
      const expectedCounter = previousCounter.add(1).toString();

      await basicNFT.mintNft();
      const counter = await basicNFT.getTokenCounter();

      assert.equal(expectedCounter, counter.toString());
    });
  });
  it("allows user to mint an NFT");
});
