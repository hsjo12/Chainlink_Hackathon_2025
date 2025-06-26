const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing, mockChainlinkResponse } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarketListing", function () {
  this.timeout(120000);
  
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter } = 
      await loadFixture(setupSecondaryMarketContracts));
  });
  
  describe("Create Listing", function () {
    it("Should create a listing with ticket verification", async function () {
      // Authorize secondary market contract to operate NFT
      await ticketContract.connect(seller).approve(secondaryMarket.target, 0);
      
      // Create listing
      const tx = await secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
      
      // Verify event
      const receipt = await tx.wait();
      const listingCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ListingCreated'
      );
      
      expect(listingCreatedEvent).to.not.be.undefined;
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      expect(listing.listingId).to.equal(1);
      expect(listing.nftContract).to.equal(ticketContract.target);
      expect(listing.tokenId).to.equal(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(LISTING_PRICE);
      expect(listing.active).to.equal(false); // Initially in pending verification state
      expect(listing.pendingVerification).to.equal(true);
      expect(listing.ticketId).to.equal("ticket123");
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(ticketId).to.equal("ticket123");
      expect(status).to.equal(1); // PENDING
    });
    
    it("Should create a listing without ticket verification", async function () {
      // Authorize secondary market contract to operate NFT
      await ticketContract.connect(seller).approve(secondaryMarket.target, 0);
      
      // Create listing without providing ticket ID
      const tx = await secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        ""
      );
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(true); // Directly activated when no ticket ID
      expect(listing.pendingVerification).to.equal(false);
      expect(listing.ticketId).to.equal("");
    });
    
    it("Should revert with invalid parameters", async function () {
      // Price is 0
      await expect(secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        0,
        LISTING_DURATION,
        "ticket123"
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidPrice");
      
      // Listing duration too short
      await expect(secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        LISTING_PRICE,
        1800, // 30 minutes, less than minimum time
        "ticket123"
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
      
      // Listing duration too long
      await expect(secondaryMarket.connect(seller).createListing(
        ticketContract.target,
        0,
        LISTING_PRICE,
        1209600, // 2 weeks, more than maximum time
        "ticket123"
      )).to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
      
      // Unsupported NFT contract
      const MockNFT = await ethers.getContractFactory("MockERC721");
      const mockNFT = await MockNFT.deploy("Mock NFT", "MNFT");
      
      await expect(secondaryMarket.connect(seller).createListing(
        mockNFT.target,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      )).to.be.revertedWithCustomError(secondaryMarket, "UnsupportedContract");
    });
  });
  
  describe("Cancel Listing", function () {
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
      
      // Mock successful verification, activate listing
      const requestId = ethers.id("mockRequestId");
      await secondaryMarket.connect(manager).setRequestToListing(requestId, 1);
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, false);
    });
    
    it("Should allow seller to cancel listing", async function () {
      // Set listing to active state
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      const listing = await secondaryMarket.getListing(1);
      listing.active = true;
      listing.pendingVerification = false;
      
      // Cancel listing
      const tx = await secondaryMarket.connect(seller).cancelListing(1);
      
      // Verify event
      const receipt = await tx.wait();
      const listingCancelledEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ListingCancelled'
      );
      
      expect(listingCancelledEvent).to.not.be.undefined;
      
      // Verify listing status
      const updatedListing = await secondaryMarket.getListing(1);
      expect(updatedListing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
    });
    
    it("Should revert when non-seller tries to cancel", async function () {
      // Set listing to active state
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      const listing = await secondaryMarket.getListing(1);
      listing.active = true;
      listing.pendingVerification = false;
      
      // Non-seller attempts to cancel
      await expect(secondaryMarket.connect(buyer).cancelListing(1))
        .to.be.revertedWithCustomError(secondaryMarket, "NotSeller");
    });
  });
});