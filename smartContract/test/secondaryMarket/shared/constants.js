const { ethers } = require("ethers");

// Secondary market test constants
const LISTING_PRICE = ethers.parseEther("0.1"); // 0.1 ETH
const LISTING_DURATION = 86400; // 1 day
const PLATFORM_FEE_PERCENT = 250; // 2.5%

module.exports = {
  LISTING_PRICE,
  LISTING_DURATION,
  PLATFORM_FEE_PERCENT
};