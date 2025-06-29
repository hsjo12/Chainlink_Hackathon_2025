const { ethers } = require("hardhat");

/**
 * Create a sample listing
 */
async function createSampleListing(secondaryMarket, seller, ticketContract, tokenId, price, duration, ticketId) {
  // Authorize secondary market contract to operate NFT
  await ticketContract.connect(seller).approve(secondaryMarket.target, tokenId);
  
  // Create listing
  return secondaryMarket.connect(seller).createListing(
    ticketContract.target,
    tokenId,
    price,
    duration,
    ticketId || ""
  );
}

/**
 * Mock Chainlink Functions response
 */
async function mockChainlinkResponse(mockRouter, secondaryMarket, requestId, isSuccess, ticketUsed = false) {
  let response = "0x";
  let err = "0x";
  
  if (isSuccess) {
    // Encode response - ensure correct format
    response = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256"],
      [ticketUsed ? 1 : 0]
    );
  } else {
    // Error case
    err = ethers.toUtf8Bytes("Verification failed");
  }
  
  // Mock Chainlink callback
  return mockRouter.fulfillRequest(
    requestId,
    secondaryMarket.target,
    response,
    err
  );
}

module.exports = {
  createSampleListing,
  mockChainlinkResponse
};