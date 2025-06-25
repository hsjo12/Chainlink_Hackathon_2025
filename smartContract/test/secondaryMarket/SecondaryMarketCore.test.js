const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarketCore", function () {
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract } = 
      await loadFixture(setupSecondaryMarketContracts));
  });
  
  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      const treasury = await loadFixture(setupSecondaryMarketContracts).then(r => r.treasury);
      
      expect(await secondaryMarket.feeRecipient()).to.equal(treasury.target);
      expect(await secondaryMarket.platformFeePercent()).to.equal(250);
      expect(await secondaryMarket.minListingDuration()).to.equal(3600);
      expect(await secondaryMarket.maxListingDuration()).to.equal(604800);
      expect(await secondaryMarket.subscriptionId()).to.equal(123);
    });
    
    it("Should revert initialization with invalid parameters", async function () {
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      const secondaryMarket = await SecondaryMarket.deploy();
      
      // Zero address as fee recipient
      await expect(secondaryMarket.initialize(
        ethers.ZeroAddress,
        250,
        3600,
        604800,
        deployer.address,
        123
      )).to.be.revertedWithCustomError(secondaryMarket, "ZeroAddress");
      
      // Fee percentage too high
      await expect(secondaryMarket.initialize(
        deployer.address,
        1001, // Exceeds 10%
        3600,
        604800,
        deployer.address,
        123
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidFeePercent");
      
      // Invalid listing time limits
      await expect(secondaryMarket.initialize(
        deployer.address,
        250,
        0, // Minimum time is 0
        604800,
        deployer.address,
        123
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
      
      await expect(secondaryMarket.initialize(
        deployer.address,
        250,
        604800,
        604800, // Maximum time equals minimum time
        deployer.address,
        123
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      // Create a listing
      await createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
    });
    
    it("Should return correct listing details", async function () {
      const listing = await secondaryMarket.getListing(1);
      
      expect(listing.listingId).to.equal(1);
      expect(listing.nftContract).to.equal(ticketContract.target);
      expect(listing.tokenId).to.equal(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(LISTING_PRICE);
      expect(listing.active).to.equal(false); // Initially in pending verification state
      expect(listing.pendingVerification).to.equal(true);
      expect(listing.ticketId).to.equal("ticket123");
    });
    
    it("Should return correct current listing ID", async function () {
      expect(await secondaryMarket.getCurrentListingId()).to.equal(1);
    });
    
    it("Should check if token is listed correctly", async function () {
      // Initial state is pending verification, so isTokenListed should return false
      expect(await secondaryMarket.isTokenListed(ticketContract.target, 0)).to.equal(false);
      
      // Mock verification passed, activate listing
      const MANAGER_ROLE = await secondaryMarket.MANAGER();
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      
      const listing = await secondaryMarket.getListing(1);
      await secondaryMarket.connect(manager).emergencyCancelListing(1);
      
      // Should no longer be listed after cancellation
      expect(await secondaryMarket.isTokenListed(ticketContract.target, 0)).to.equal(false);
    });
    
    it("Should return correct ticket status for a listing", async function () {
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(ticketId).to.equal("ticket123");
      expect(status).to.equal(1); // PENDING
    });
  });
  
  describe("Access Control", function () {
    it("Should allow only UPGRADER role to authorize upgrades", async function () {
      const UPGRADER_ROLE = await secondaryMarket.UPGRADER();
      
      // Grant buyer UPGRADER role
      await secondaryMarket.grantRole(UPGRADER_ROLE, buyer.address);
      
      // Deploy new implementation contract
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      const newImplementation = await SecondaryMarket.deploy();
      
      // Non-UPGRADER cannot upgrade
      await expect(secondaryMarket.connect(seller).upgradeToAndCall(
        newImplementation.target,
        "0x"
      )).to.be.reverted;
      
      // UPGRADER can upgrade
      await expect(secondaryMarket.connect(buyer).upgradeToAndCall(
        newImplementation.target,
        "0x"
      )).to.not.be.reverted;
    });
  });
});