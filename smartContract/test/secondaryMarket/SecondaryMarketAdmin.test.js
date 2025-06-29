const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarketAdmin", function () {
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract } = 
      await loadFixture(setupSecondaryMarketContracts));
  });
  
  describe("Admin Functions", function () {
    it("Should allow manager to set subscription ID", async function () {
      const newSubscriptionId = 456;
      
      await secondaryMarket.connect(manager).setSubscriptionId(newSubscriptionId);
      
      expect(await secondaryMarket.subscriptionId()).to.equal(newSubscriptionId);
    });
    
    it("Should allow manager to set platform fee", async function () {
      const newFeePercent = 300; // 3%
      
      const tx = await secondaryMarket.connect(manager).setPlatformFee(newFeePercent);
      
      // Verify event
      const receipt = await tx.wait();
      const feeUpdatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'PlatformFeeUpdated'
      );
      
      expect(feeUpdatedEvent).to.not.be.undefined;
      expect(await secondaryMarket.platformFeePercent()).to.equal(newFeePercent);
    });
    
    it("Should revert when setting invalid platform fee", async function () {
      const invalidFeePercent = 1001; // Exceeds 10%
      
      await expect(secondaryMarket.connect(manager).setPlatformFee(invalidFeePercent))
        .to.be.revertedWithCustomError(secondaryMarket, "InvalidFeePercent");
    });
    
    it("Should allow manager to set fee recipient", async function () {
      const newFeeRecipient = buyer.address;
      
      const tx = await secondaryMarket.connect(manager).setFeeRecipient(newFeeRecipient);
      
      // Verify event
      const receipt = await tx.wait();
      const recipientUpdatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'FeeRecipientUpdated'
      );
      
      expect(recipientUpdatedEvent).to.not.be.undefined;
      expect(await secondaryMarket.feeRecipient()).to.equal(newFeeRecipient);
    });
    
    it("Should revert when setting zero address as fee recipient", async function () {
      await expect(secondaryMarket.connect(manager).setFeeRecipient(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(secondaryMarket, "ZeroAddress");
    });
    
    it("Should allow manager to set supported contract", async function () {
      const MockNFT = await ethers.getContractFactory("MockERC721");
      const mockNFT = await MockNFT.deploy("Mock NFT", "MNFT");
      
      const tx = await secondaryMarket.connect(manager).setSupportedContract(mockNFT.target, true);
      
      // Verify event
      const receipt = await tx.wait();
      const contractUpdatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ContractSupportUpdated'
      );
      
      expect(contractUpdatedEvent).to.not.be.undefined;
      expect(await secondaryMarket.supportedContracts(mockNFT.target)).to.equal(true);
    });
    
    it("Should allow manager to set listing duration limits", async function () {
      const newMinDuration = 7200; // 2 hours
      const newMaxDuration = 1209600; // 2 weeks
      
      await secondaryMarket.connect(manager).setListingDurationLimits(newMinDuration, newMaxDuration);
      
      expect(await secondaryMarket.minListingDuration()).to.equal(newMinDuration);
      expect(await secondaryMarket.maxListingDuration()).to.equal(newMaxDuration);
    });
    
    it("Should revert when setting invalid listing duration limits", async function () {
      // Minimum time is 0
      await expect(secondaryMarket.connect(manager).setListingDurationLimits(0, 604800))
        .to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
      
      // Maximum time less than or equal to minimum time
      await expect(secondaryMarket.connect(manager).setListingDurationLimits(604800, 604800))
        .to.be.revertedWithCustomError(secondaryMarket, "InvalidDuration");
    });
    
    it("Should allow manager to pause and unpause the contract", async function () {
      await secondaryMarket.connect(manager).pause();
      expect(await secondaryMarket.paused()).to.equal(true);
      
      // Cannot create listing when paused
      await expect(createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      )).to.be.reverted;
      
      await secondaryMarket.connect(manager).unpause();
      expect(await secondaryMarket.paused()).to.equal(false);
      
      // Can create listing after unpaused
      await expect(createSampleListing(
        secondaryMarket,
        seller,
        ticketContract,
        0,
        LISTING_PRICE,
        LISTING_DURATION,
        "ticket123"
      )).to.not.be.reverted;
    });
    
    it("Should allow manager to emergency cancel listing", async function () {
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
      
      // Admin emergency cancels listing
      const tx = await secondaryMarket.connect(manager).emergencyCancelListing(1);
      
      // Verify event
      const receipt = await tx.wait();
      const listingCancelledEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ListingCancelled'
      );
      
      expect(listingCancelledEvent).to.not.be.undefined;
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // DELISTED
    });
    
    it("Should allow manager to set ticket status", async function () {
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
      
      // Admin sets ticket status
      const tx = await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
      
      // Verify event
      const receipt = await tx.wait();
      const statusUpdatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'TicketStatusUpdated'
      );
      
      expect(statusUpdatedEvent).to.not.be.undefined;
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(2); // ACTIVE
    });
    
    it("Should revert when non-manager calls admin functions", async function () {
      await expect(secondaryMarket.connect(buyer).setSubscriptionId(456))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).setPlatformFee(300))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).setFeeRecipient(buyer.address))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).setSupportedContract(ticketContract.target, false))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).setListingDurationLimits(7200, 1209600))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).pause())
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).unpause())
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).emergencyCancelListing(1))
        .to.be.reverted;
      
      await expect(secondaryMarket.connect(buyer).setTicketStatus("ticket123", 2))
        .to.be.reverted;
    });
  });
});