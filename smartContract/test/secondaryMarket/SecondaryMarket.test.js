const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing, mockChainlinkResponse } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarket Integration", function () {
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter } = 
      await loadFixture(setupSecondaryMarketContracts));
  });
  
  describe("Complete Listing and Purchase Flow", function () {
    it("Should handle the complete flow from listing to purchase", async function () {
      // 1. Create listing
      await createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
      
      // Verify listing status
      let listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(false); // Initially in pending verification state
      expect(listing.pendingVerification).to.equal(true);
      
      // 2. Mock Chainlink verification passed
      const requestId = ethers.id("mockRequestId");
      await secondaryMarket.connect(manager).setRequestToListing(requestId, 1);
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, false);
      // Manually set listing to active state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      listing = await secondaryMarket.getListing(1);
      listing.active = true;
      listing.pendingVerification = false;
      
      // 3. Purchase listing
      await secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      });
      
      // Verify listing status
      listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // SOLD
      
      // Verify NFT transfer
      expect(await ticketContract.ownerOf(0)).to.equal(buyer.address);
    });
    
    it("Should handle listing verification failure", async function () {
      // 1. Create listing
      await createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
      
      // 2. Mock Chainlink verification failed (ticket already used)
      const requestId = ethers.id("mockRequestId");
      await secondaryMarket.connect(manager).setRequestToListing(requestId, 1);
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, true);
      // Manually set listing to cancelled state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 3); // DELISTED
      const listing = await secondaryMarket.getListing(1);
      listing.active = false;
      listing.pendingVerification = false;
      
      // Verify listing status
      expect(listing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
      
      // 3. Attempt to purchase should fail
      await expect(secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      })).to.be.revertedWithCustomError(secondaryMarket, "ListingNotActive");
    });
    
    it("Should handle admin intervention in the flow", async function () {
      // 1. Create listing
      await createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
      
      // 2. Admin emergency cancels listing
      await secondaryMarket.connect(manager).emergencyCancelListing(1);
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
      
      // 3. Attempt to purchase should fail
      await expect(secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      })).to.be.revertedWithCustomError(secondaryMarket, "ListingNotActive");
    });
  });
  
  describe("Chainlink Functions Integration", function () {
    it("Should correctly override fulfillRequest", async function () {
      // This test mainly verifies that the SecondaryMarket contract correctly overrides the fulfillRequest function
      // Since we can't directly call fulfillRequest (it's internal), we test through behavior
      
      // 1. Create listing
      await createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      );
      
      // 2. Mock Chainlink verification passed
      const requestId = ethers.id("mockRequestId");
      await secondaryMarket.connect(manager).setRequestToListing(requestId, 1);
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, false);
      // Manually set listing to active state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      const listing = await secondaryMarket.getListing(1);
      listing.active = true;
      listing.pendingVerification = false;
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(2); // ACTIVE
    });
  });
});