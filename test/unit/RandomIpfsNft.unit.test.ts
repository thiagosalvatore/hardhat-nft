import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Contract } from "ethers";
import { Address } from "hardhat-deploy/dist/types";
import { assert, expect } from "chai";
import { getSigners } from "@nomiclabs/hardhat-ethers/internal/helpers";

describe("RandomIpfsNft", () => {
  let randomIpfsNft: Contract;
  let deployer: Address;
  let vrfCoordinatorMock: Contract;

  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["mocks", "randomnft"]);
    randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
    vrfCoordinatorMock = await ethers.getContract(
      "VRFCoordinatorV2Mock",
      deployer
    );
  });

  describe("when getBreedFromModdedRng is called", () => {
    it("should return pug when moddedRng is less than 10", async () => {
      const breed = await randomIpfsNft.getBreedFromModdedRng("6");

      assert.equal(breed, "0");
    });

    it("should return Shiba Inu when moddedRng is more than 10 and less than 40", async () => {
      const breed = await randomIpfsNft.getBreedFromModdedRng("20");

      assert.equal(breed, "1");
    });

    it("should return ST Bernard when moddedRng is more than 40", async () => {
      const breed = await randomIpfsNft.getBreedFromModdedRng("45");

      assert.equal(breed, "2");
    });

    it("should revert when moddedRng is more than 130", async () => {
      await expect(
        randomIpfsNft.getBreedFromModdedRng("140")
      ).to.be.revertedWithCustomError(
        randomIpfsNft,
        "RandomIpfsNft__RangeOutOfBounds"
      );
    });
  });

  describe("when initialized", () => {
    it("should have counter equals zero", async () => {
      const counter = await randomIpfsNft.getTokenCounter();

      assert.equal(counter.toString(), "0");
    });

    it("should have mint fee equals 10000000000000000", async () => {
      const mintFee = await randomIpfsNft.getMintFee();

      assert.equal(mintFee.toString(), "10000000000000000");
    });

    it("should have correct dog tokens URIs", async () => {
      const pugTokenURI = await randomIpfsNft.getDogTokenUris(0);
      const shibaTokenURI = await randomIpfsNft.getDogTokenUris(1);
      const stBernardTokenURI = await randomIpfsNft.getDogTokenUris(2);

      assert.equal(
        pugTokenURI,
        "ipfs://QmXbF79VpipbX5UayPTemtJ3488Vi38Zdjxn3r2u1TudAK"
      );
      assert.equal(
        shibaTokenURI,
        "ipfs://Qma5g3X1G6n2kFhRUy8oDmZ9VytTWKukqEWCe4ugJAKssk"
      );
      assert.equal(
        stBernardTokenURI,
        "ipfs://QmYnKwSYVgQeiJjbqGormHyd2Tgkxeq6NEafzUhJ3sXEZW"
      );
    });
  });

  describe("when requestNFT is called", () => {
    it("should revert when value is not enough", async () => {
      await expect(
        randomIpfsNft.requestNft({ value: "0" })
      ).to.be.revertedWithCustomError(
        randomIpfsNft,
        "RandomIpfsNft__NeedMoreEthSent"
      );
    });

    it("should emit NftRequested event", async () => {
      await expect(
        randomIpfsNft.requestNft({ value: "10000000000000000" })
      ).to.emit(randomIpfsNft, "NftRequested");
    });
  });

  describe("when fulfillRandomWords is called", () => {
    beforeEach(async () => {
      await randomIpfsNft.requestNft({ value: "10000000000000000" });
    });

    it("should emit NftMinted event", async () => {
      const tx = await randomIpfsNft.requestNft({ value: "10000000000000000" });
      const txReceipt = await tx.wait(1);
      const requestId = txReceipt.events[1].args.requestId;

      await expect(
        vrfCoordinatorMock.fulfillRandomWords(requestId, randomIpfsNft.address)
      ).to.emit(randomIpfsNft, "NftMinted");
    });

    it("should increase the token counter", async () => {
      const tx = await randomIpfsNft.requestNft({ value: "10000000000000000" });
      const txReceipt = await tx.wait(1);
      const requestId = txReceipt.events[1].args.requestId;
      const currentTokenCounter = await randomIpfsNft.getTokenCounter();

      await vrfCoordinatorMock.fulfillRandomWords(
        requestId,
        randomIpfsNft.address
      );

      const updatedTokenCounter = await randomIpfsNft.getTokenCounter();
      assert.equal(
        updatedTokenCounter.toString(),
        currentTokenCounter.add("1").toString()
      );
    });

    it("should set the token URI", async () => {
      const tx = await randomIpfsNft.requestNft({ value: "10000000000000000" });
      const txReceipt = await tx.wait(1);
      const requestId = txReceipt.events[1].args.requestId;
      const currentTokenCounter = await randomIpfsNft.getTokenCounter();

      await vrfCoordinatorMock.fulfillRandomWords(
        requestId,
        randomIpfsNft.address
      );

      const tokenURI = await randomIpfsNft.tokenURI(currentTokenCounter);
      assert.isNotNull(tokenURI);
    });
  });

  describe("when withdraw is called", () => {
    it("should revert when call is not from owner", async () => {
      const signers = await ethers.getSigners();
      const accountConnectedNft = randomIpfsNft.connect(signers[1]);
      await accountConnectedNft.requestNft({ value: "10000000000000000" });

      await expect(accountConnectedNft.withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should set the balance as zero when owner withdraws from it", async () => {
      await randomIpfsNft.requestNft({ value: "10000000000000000" });

      await randomIpfsNft.withdraw();

      const currentBalance = await randomIpfsNft.provider.getBalance(
        randomIpfsNft.address
      );
      assert.equal(currentBalance.toString(), "0");
    });

    it("should update the balance of contract owner", async () => {
      await randomIpfsNft.requestNft({ value: "10000000000000000" });
      const startingContractBalance = await randomIpfsNft.provider.getBalance(
        randomIpfsNft.address
      );
      const startingDeployerBalance = await randomIpfsNft.provider.getBalance(
        deployer
      );

      const tx = await randomIpfsNft.withdraw();
      const txReceipt = await tx.wait(1);
      const { gasUsed, effectiveGasPrice } = txReceipt;
      const totalGasCost = gasUsed.mul(effectiveGasPrice);
      const currentBalance = await randomIpfsNft.provider.getBalance(deployer);

      assert.equal(
        startingContractBalance.add(startingDeployerBalance).toString(),
        currentBalance.add(totalGasCost).toString()
      );
    });
  });
});
