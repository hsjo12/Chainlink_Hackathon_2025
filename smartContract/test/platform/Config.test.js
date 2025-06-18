const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Config Test", () => {
  let user1, config;
  const ZERO_ADDRESS = ethers.ZeroAddress;
  beforeEach(async () => {
    ({ user1, config, feeManager, treasury } = await loadFixture(
      setupContracts
    ));
  });

  context("Valid Scenarios", () => {
    it("Should correctly set and get the FeeManager address", async () => {
      expect(await config.getFeeManager()).to.eq(feeManager.target);
      await config.setFeeManager(ZERO_ADDRESS);
      expect(await config.getFeeManager()).to.eq(ZERO_ADDRESS);
    });

    it("Should correctly set and get the Treasury address", async () => {
      expect(await config.getTreasury()).to.eq(treasury.target);
      await config.setTreasury(ZERO_ADDRESS);
      expect(await config.getTreasury()).to.eq(ZERO_ADDRESS);
    });

    it("Should correctly set and get the OrganizerRegistry address", async () => {
      expect(await config.getOrganizerRegistry()).to.eq(treasury.target);
      await config.setOrganizerRegistry(ZERO_ADDRESS);
      expect(await config.getOrganizerRegistry()).to.eq(ZERO_ADDRESS);
    });
  });

  context("Invalid Scenarios", () => {
    it("Should revert when non-manager tries to set FeeManager or Treasury", async () => {
      await expect(config.connect(user1).setFeeManager(ZERO_ADDRESS)).reverted;
      await expect(config.connect(user1).setTreasury(ZERO_ADDRESS)).reverted;
      await expect(config.connect(user1).setOrganizerRegistry(ZERO_ADDRESS))
        .reverted;
    });
  });
});
