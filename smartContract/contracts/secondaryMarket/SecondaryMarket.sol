// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./SecondaryMarketListing.sol";
import "./SecondaryMarketPurchase.sol";
import "./SecondaryMarketVerification.sol";
import "./SecondaryMarketAdmin.sol";

/**
 * @title   SecondaryMarket
 * @notice  Main contract that combines all secondary market functionality
 * @dev     Inherits from all specialized contracts to provide complete functionality
 */
contract SecondaryMarket is 
    SecondaryMarketListing,
    SecondaryMarketPurchase,
    SecondaryMarketVerification,
    SecondaryMarketAdmin
{
    // This contract inherits all functionality from its parent contracts
    // No additional implementation needed here
}