const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketInfoConsumer", function () {
  let ticketInfoConsumer;
  let owner;
  let addr1;
  
  // Mock data
  const MOCK_SUBSCRIPTION_ID = 1;
  const MOCK_EVENT_ID = "event123";
  const MOCK_TICKET_ID = "ticket456";
  const MOCK_REMAINING_TICKETS = 50;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy TestTicketInfoConsumer for testing
    const TestTicketInfoConsumer = await ethers.getContractFactory("TestTicketInfoConsumer");
    ticketInfoConsumer = await TestTicketInfoConsumer.deploy();
    await ticketInfoConsumer.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ticketInfoConsumer.owner()).to.equal(owner.address);
    });
    
    it("Should initialize with correct default values", async function () {
      expect(await ticketInfoConsumer.remainingTickets()).to.equal(0);
      expect(await ticketInfoConsumer.s_lastCheckedTicketId()).to.equal("");
      expect(await ticketInfoConsumer.s_lastTicketUsed()).to.equal(false);
    });
  });
  
  describe("Request Functions", function () {
    it("Should allow owner to request remaining tickets", async function () {
      const args = [MOCK_EVENT_ID];
      
      await expect(ticketInfoConsumer.requestRemainingTickets(MOCK_SUBSCRIPTION_ID, args))
        .to.not.be.reverted;
    });
    
    it("Should not allow non-owner to request remaining tickets", async function () {
      const args = [MOCK_EVENT_ID];
      
      await expect(
        ticketInfoConsumer.connect(addr1).requestRemainingTickets(MOCK_SUBSCRIPTION_ID, args)
      ).to.be.revertedWith("Only callable by owner");
    });
    
    it("Should allow owner to verify ticket usage", async function () {
      await expect(ticketInfoConsumer.verifyTicketUsage(MOCK_SUBSCRIPTION_ID, MOCK_TICKET_ID))
        .to.not.be.reverted;
        
      expect(await ticketInfoConsumer.s_lastCheckedTicketId()).to.equal(MOCK_TICKET_ID);
    });
    
    it("Should revert when verifying empty ticket ID", async function () {
      await expect(
        ticketInfoConsumer.verifyTicketUsage(MOCK_SUBSCRIPTION_ID, "")
      ).to.be.revertedWithCustomError(ticketInfoConsumer, "InvalidTicketID");
    });
    
    it("Should not allow non-owner to verify ticket usage", async function () {
      await expect(
        ticketInfoConsumer.connect(addr1).verifyTicketUsage(MOCK_SUBSCRIPTION_ID, MOCK_TICKET_ID)
      ).to.be.revertedWith("Only callable by owner");
    });
  });
  
  describe("Fulfill Request (Mock)", function () {
    it("Should handle availability response correctly", async function () {
      // Encode mock response for remaining tickets
      const encodedResponse = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"], 
        [MOCK_REMAINING_TICKETS]
      );
      
      // First make a request to set s_lastRequestId
      await ticketInfoConsumer.requestRemainingTickets(MOCK_SUBSCRIPTION_ID, [MOCK_EVENT_ID]);
      
      // Get the request ID that was set
      const requestId = await ticketInfoConsumer.s_lastRequestId();
      
      // Simulate fulfillment
      await expect(
        ticketInfoConsumer.testFulfillRequest(requestId, encodedResponse, "0x")
      ).to.emit(ticketInfoConsumer, "Response")
        .withArgs(requestId, MOCK_REMAINING_TICKETS, encodedResponse, "0x");
      
      expect(await ticketInfoConsumer.remainingTickets()).to.equal(MOCK_REMAINING_TICKETS);
    });
    
    it("Should handle ticket verification response correctly", async function () {
      // First verify a ticket to set s_lastCheckedTicketId
      await ticketInfoConsumer.verifyTicketUsage(MOCK_SUBSCRIPTION_ID, MOCK_TICKET_ID);
      
      // Encode mock response for ticket verification (ticket is used)
      const encodedResponse = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"], 
        [1] // 1 means ticket is used
      );
      
      const requestId = await ticketInfoConsumer.s_lastRequestId();
      
      await expect(
        ticketInfoConsumer.testFulfillRequest(requestId, encodedResponse, "0x")
      ).to.emit(ticketInfoConsumer, "TicketVerified")
        .withArgs(requestId, MOCK_TICKET_ID, true, encodedResponse, "0x");
      
      expect(await ticketInfoConsumer.isTicketUsed(MOCK_TICKET_ID)).to.equal(true);
      expect(await ticketInfoConsumer.s_lastTicketUsed()).to.equal(true);
    });
    
    it("Should handle error responses", async function () {
      await ticketInfoConsumer.requestRemainingTickets(MOCK_SUBSCRIPTION_ID, [MOCK_EVENT_ID]);
      
      const requestId = await ticketInfoConsumer.s_lastRequestId();
      const errorMessage = ethers.toUtf8Bytes("API request failed");
      
      await expect(
        ticketInfoConsumer.testFulfillRequest(requestId, "0x", errorMessage)
      ).to.emit(ticketInfoConsumer, "Response")
        .withArgs(requestId, 0, "0x", errorMessage);
    });
    
    it("Should revert on unexpected request ID", async function () {
      const wrongRequestId = "0x9999999999999999999999999999999999999999999999999999999999999999";
      
      await expect(
        ticketInfoConsumer.testFulfillRequest(wrongRequestId, "0x", "0x")
      ).to.be.revertedWithCustomError(ticketInfoConsumer, "UnexpectedRequestID");
    });
  });
  
  describe("View Functions", function () {
    it("Should return correct ticket usage status", async function () {
      // Initially, ticket should not be used
      expect(await ticketInfoConsumer.isTicketUsed(MOCK_TICKET_ID)).to.equal(false);
      
      // Simulate ticket verification and fulfillment
      await ticketInfoConsumer.verifyTicketUsage(MOCK_SUBSCRIPTION_ID, MOCK_TICKET_ID);
      
      const encodedResponse = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"], 
        [1] // ticket is used
      );
      
      const requestId = await ticketInfoConsumer.s_lastRequestId();
      await ticketInfoConsumer.testFulfillRequest(requestId, encodedResponse, "0x");
      
      // Now ticket should be marked as used
      expect(await ticketInfoConsumer.isTicketUsed(MOCK_TICKET_ID)).to.equal(true);
    });
  });
});