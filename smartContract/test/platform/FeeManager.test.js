const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { FEE_RATE } = require("../shared/constants");
const { feeCalculator } = require("../shared/utilities");
describe("FeeManager Test", () => {
  let user1, feeManager;
  const NEW_FEE_RATE = 1_000n;
  beforeEach(async () => {
    ({ user1, feeManager } = await loadFixture(setupContracts));
  });
  context("Valid Scenarios", () => {
    it("should correctly set and get the fee rate", async () => {
      expect(await feeManager.getFeeRate()).to.eq(FEE_RATE);

      await feeManager.setFeeRate(NEW_FEE_RATE);
      expect(await feeManager.getFeeRate()).to.eq(NEW_FEE_RATE);
    });

    it("should correctly calculate the fee", async () => {
      const price = ethers.parseEther("1");

      expect(await feeManager.calculateFee(price)).to.eq(
        feeCalculator(price, FEE_RATE)
      );
    });
  });
  context("Invalid Scenarios", () => {
    it("should revert when non-manager tries to set the fee rate", async () => {
      await expect(feeManager.connect(user1).setFeeRate(NEW_FEE_RATE)).to.be
        .reverted;
    });
  });
});
