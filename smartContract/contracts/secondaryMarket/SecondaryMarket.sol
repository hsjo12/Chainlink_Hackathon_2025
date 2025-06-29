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
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override(SecondaryMarketVerification, TicketInfoConsumer) {

        SecondaryMarketVerification.fulfillRequest(requestId, response, err);
    }
}