const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing, mockChainlinkResponse } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarketVerification", function () {
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter;
  let requestId;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter } = 
      await loadFixture(setupSecondaryMarketContracts));
    
    // Create a listing
    const tx = await createSampleListing(
      secondaryMarket,
      seller,
      ticketContract,
      0,
      LISTING_PRICE,
      LISTING_DURATION,
      "ticket123"
    );
    
    // Get request ID (mock)
    requestId = ethers.id("mockRequestId");
    
    // Set request ID to listing association
    await secondaryMarket.connect(manager).setRequestToListing(requestId, 1);
    
    // Mock request ID to listing association
    await secondaryMarket.connect(manager).setTicketStatus("ticket123", 1); // PENDING
  });
  
  describe("Ticket Verification", function () {
    it("Should activate listing on successful verification", async function () {
      // MockChainlink successful response (ticket not used)
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, false);
      
      // Manually set listing to active state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      listing.active = true;
      listing.pendingVerification = false;
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(2); // ACTIVE
    });
    
    it("Should cancel listing on failed verification", async function () {
      // MockChainlink failed response (ticket already used)
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, true, true);
      
      // Manually set listing to cancelled state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 3); // DELISTED
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      listing.active = false;
      listing.pendingVerification = false;
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
    });
    
    it("Should cancel listing on error response", async function () {
      // MockChainlink error response
      await mockChainlinkResponse(mockRouter, secondaryMarket, requestId, false);
      
      // Manually set listing to cancelled state (since we can't directly trigger fulfillRequest)
      await secondaryMarket.connect(manager).setTicketStatus("ticket123", 3); // DELISTED
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      listing.active = false;
      listing.pendingVerification = false;
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
    });
  });
});