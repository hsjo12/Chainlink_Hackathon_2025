// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * @dev Enum representing different ticket tiers or levels.
 */
enum Tier {
    VIP, // VIP tier with premium benefits
    STANDARD, // Standard tier with regular access
    STANDING // No specific seat and no check if seat is claimed in the mint function
}
/**
 * @dev Struct containing information for each ticket tier.
 */
struct TierInfo {
    uint256 priceUSD; // Price in USD
    uint256 maxSupply; // Maximum number of tickets for this tier
    uint256 sold; // Number of tickets sold so far
}
