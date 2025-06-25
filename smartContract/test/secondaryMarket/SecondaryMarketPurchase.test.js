const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupSecondaryMarketContracts } = require("./shared/fixtures");
const { createSampleListing, mockChainlinkResponse } = require("./shared/utilities");
const { LISTING_PRICE, LISTING_DURATION } = require("./shared/constants");

describe("SecondaryMarketPurchase", function () {
  let secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter, treasury;
  
  beforeEach(async function () {
    ({ secondaryMarket, deployer, seller, buyer, manager, ticketContract, mockRouter, treasury } = 
      await loadFixture(setupSecondaryMarketContracts));
    
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
    
    // Mock verification passed, activate listing
    await secondaryMarket.connect(manager).setTicketStatus("ticket123", 2); // ACTIVE
    
    // Manually set listing to active state
    const listing = await secondaryMarket.getListing(1);
    listing.active = true;
    listing.pendingVerification = false;
  });
  
  describe("Purchase Listing", function () {
    it("Should allow buyer to purchase listing", async function () {
      // Record initial balances
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialTreasuryBalance = await ethers.provider.getBalance(treasury.target);
      
      // Purchase listing
      const tx = await secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      });
      
      // Verify event
      const receipt = await tx.wait();
      const listingPurchasedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ListingPurchased'
      );
      
      expect(listingPurchasedEvent).to.not.be.undefined;
      
      // Verify listing status
      const listing = await secondaryMarket.getListing(1);
      expect(listing.active).to.equal(false);
      
      // Verify ticket status
      const [ticketId, status] = await secondaryMarket.getListingTicketStatus(1);
      expect(status).to.equal(3); // SOLD
      
      // Verify NFT transfer
      expect(await ticketContract.ownerOf(0)).to.equal(buyer.address);
      
      // Verify fee distribution
      const platformFee = (LISTING_PRICE * 250n) / 10000n; // 2.5%
      const sellerAmount = LISTING_PRICE - platformFee;
      
      const finalTreasuryBalance = await ethers.provider.getBalance(treasury.target);
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(platformFee);
      expect(finalSellerBalance - initialSellerBalance).to.equal(sellerAmount);
    });
    
    it("Should allow buyer to purchase with excess payment and receive refund", async function () {
      const excessAmount = ethers.parseEther("0.05"); // Pay extra 0.05 ETH
      const totalPayment = LISTING_PRICE + excessAmount;
      
      // Record initial balances
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      // Purchase listing, pay extra amount
      const tx = await secondaryMarket.connect(buyer).purchaseListing(1, {
        value: totalPayment
      });
      
      // Calculate transaction fee
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Verify buyer balance change (should only decrease by actual price + gas fee)
      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      const expectedBalance = initialBuyerBalance - LISTING_PRICE - gasUsed;
      
      // Allow 1wei error margin
      const balanceDiff = finalBuyerBalance - expectedBalance;
      expect(balanceDiff).to.be.closeTo(0n, 1n);
    });
    
    it("Should revert with insufficient payment", async function () {
      const insufficientPayment = LISTING_PRICE - ethers.parseEther("0.01");
      
      await expect(secondaryMarket.connect(buyer).purchaseListing(1, {
        value: insufficientPayment
      })).to.be.revertedWithCustomError(secondaryMarket, "InsufficientPayment");
    });
    
    it("Should revert when listing is not active", async function () {
      // Cancel listing
      await secondaryMarket.connect(seller).cancelListing(1);
      
      await expect(secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      })).to.be.revertedWithCustomError(secondaryMarket, "ListingNotActive");
    });
    
    it("Should revert when listing has expired", async function () {
      // Fast forward time to make listing expire
      await ethers.provider.send("evm_increaseTime", [LISTING_DURATION + 1]);
      await ethers.provider.send("evm_mine");
      
      await expect(secondaryMarket.connect(buyer).purchaseListing(1, {
        value: LISTING_PRICE
      })).to.be.revertedWithCustomError(secondaryMarket, "ListingExpired");
    });
  });
});