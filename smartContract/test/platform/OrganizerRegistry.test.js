const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");

describe("OrganizerRegistry Test", () => {
  let user1, organizerRegistry;

  beforeEach(async () => {
    ({ user1, organizerRegistry } = await loadFixture(setupContracts));
  });

  context("Valid Scenarios", () => {
    it("should correctly set and check organizer status", async () => {
      await organizerRegistry.setOrganizer(user1.address, true);
      expect(await organizerRegistry.checkOrganizer(user1.address)).to.be.true;

      await organizerRegistry.setOrganizer(user1.address, false);
      expect(await organizerRegistry.checkOrganizer(user1.address)).to.be.false;
    });
  });
  context("Invalid Scenarios", () => {
    it("should revert when non-manager tries to set organizer status", async () => {
      await expect(
        organizerRegistry.connect(user1).setOrganizer(user1.address, true)
      ).to.be.reverted;
    });
  });
});
