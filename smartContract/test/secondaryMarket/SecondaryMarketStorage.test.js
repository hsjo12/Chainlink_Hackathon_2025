const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");

describe("SecondaryMarketStorage", function () {
  let secondaryMarket, deployer, seller, buyer, manager;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager } = await loadFixture(setupSecondaryMarketContracts));
  });
  
  describe("State Variables", function () {
    it("Should initialize with correct platform fee", async function () {
      expect(await secondaryMarket.platformFeePercent()).to.equal(250); // 2.5%
    });
    
    it("Should initialize with correct fee recipient", async function () {
      const treasury = await loadFixture(setupSecondaryMarketContracts).then(r => r.treasury);
      expect(await secondaryMarket.feeRecipient()).to.equal(treasury.target);
    });
    
    it("Should initialize with correct listing duration limits", async function () {
      expect(await secondaryMarket.minListingDuration()).to.equal(3600); // 1 hour
      expect(await secondaryMarket.maxListingDuration()).to.equal(604800); // 1 week
    });
  });
  
  describe("Enums", function () {
    it("Should have correct TicketStatus enum values", async function () {
      // Test enum indirectly by creating a listing and checking status
      const { ticketContract } = await loadFixture(setupSecondaryMarketContracts);
      
      // Authorize secondary market contract to operate NFT
      await ticketContract.connect(seller).approve(secondaryMarket.target, 0);
      
      // Create listing
      await secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        ethers.parseEther("0.1"),
        86400,
        "ticket123"
      );
      
      // Get ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(ticketId).to.equal("ticket123");
      expect(status).to.equal(1); // PENDING
    });
  });
});