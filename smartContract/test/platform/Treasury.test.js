const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
  getUSDCContractOnETHMainNet,
  getUSDCWhaleOnETHMainNet,
} = require("../shared/utilities");

describe("Treasury Test", () => {
  let user1, usdc, faucet, treasury;
  const ETH_AMOUNT = ethers.parseEther("1");
  const USDC_AMOUNT = ethers.parseUnits("1", 6);

  beforeEach(async () => {
    usdc = await getUSDCContractOnETHMainNet();
    ({ user1: receiver, faucet, treasury } = await loadFixture(setupContracts));
  });
  context("Valid Scenarios", () => {
    it("should allow the manager to withdraw ETH to a receiver", async () => {
      await faucet.sendTransaction({
        to: treasury.target,
        value: ETH_AMOUNT,
      });

      const balanceOfTreasuryBefore = await ethers.provider.getBalance(
        treasury.target
      );
      const balanceOfReceiverBefore = await ethers.provider.getBalance(
        receiver.address
      );

      await treasury.withdrawETH(receiver.address);

      const balanceOfTreasuryAfter = await ethers.provider.getBalance(
        treasury.target
      );
      const balanceOfReceiverAfter = await ethers.provider.getBalance(
        receiver.address
      );

      expect(balanceOfTreasuryAfter).to.eq(
        balanceOfTreasuryBefore - ETH_AMOUNT
      );
      expect(balanceOfReceiverAfter).to.eq(
        balanceOfReceiverBefore + ETH_AMOUNT
      );
    });

    it("should allow the manager to withdraw ERC20 tokens to a receiver", async () => {
      const usdcWhale = await getUSDCWhaleOnETHMainNet();
      await usdc.connect(usdcWhale).transfer(treasury.target, USDC_AMOUNT);

      const balanceOfTreasuryBefore = await usdc.balanceOf(treasury.target);
      const balanceOfReceiverBefore = await usdc.balanceOf(receiver.address);

      await treasury.withdrawToken(receiver.address, usdc.target);

      const balanceOfTreasuryAfter = await usdc.balanceOf(treasury.target);
      const balanceOfReceiverAfter = await usdc.balanceOf(receiver.address);

      expect(balanceOfTreasuryAfter).to.eq(
        balanceOfTreasuryBefore - USDC_AMOUNT
      );
      expect(balanceOfReceiverAfter).to.eq(
        balanceOfReceiverBefore + USDC_AMOUNT
      );
    });
  });
  context("Invalid Scenarios", () => {
    it("should revert when a non-manager tries to withdraw ETH or tokens", async () => {
      await expect(treasury.connect(receiver).withdrawETH(receiver.address)).to
        .be.reverted;

      await expect(
        treasury.connect(receiver).withdrawToken(receiver.address, usdc.target)
      ).to.be.reverted;
    });
  });
});
