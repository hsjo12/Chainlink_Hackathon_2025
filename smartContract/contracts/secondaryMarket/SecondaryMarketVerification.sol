// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./SecondaryMarketCore.sol";

/**
 * @title   SecondaryMarketVerification
 * @notice  Handles ticket verification functionality
 * @dev     Extends SecondaryMarketCore with verification-specific operations
 */
contract SecondaryMarketVerification is SecondaryMarketCore {
    /**
     * @notice Override fulfillRequest callback function to handle ticket verification results
     * @param requestId The request ID being fulfilled
     * @param response The raw response returned from the JavaScript function
     * @param err Any error message returned during execution
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override(TicketInfoConsumer) {
        // First call the parent contract's fulfillRequest to handle basic logic
        super.fulfillRequest(requestId, response, err);
        
        // Check if this is a listing-related ticket verification request
        uint256 listingId = requestToListing[requestId];
        if (listingId > 0) {
            Listing storage listing = listings[listingId];
            
            // Ensure the listing exists and is in pending verification status
            if (listing.listingId != 0 && listing.pendingVerification) {
                string memory ticketId = listing.ticketId;
                
                // Update listing status based on ticket verification result
                if (err.length == 0 && !ticketUsageStatus[ticketId]) {
                    // Ticket verification successful, activate listing
                    listing.active = true;
                    listing.pendingVerification = false;
                    // Update ticket status to ACTIVE
                    ticketStatus[ticketId] = TicketStatus.ACTIVE;
                    emit TicketStatusUpdated(ticketId, TicketStatus.ACTIVE);
                    emit ListingVerified(listingId, ticketId, true);
                } else {
                    // Ticket verification failed or error occurred, cancel listing
                    listing.active = false;
                    listing.pendingVerification = false;
                    tokenToListing[listing.nftContract][listing.tokenId] = 0;
                    // Update ticket status to DELISTED
                    ticketStatus[ticketId] = TicketStatus.DELISTED;
                    emit TicketStatusUpdated(ticketId, TicketStatus.DELISTED);
                    emit ListingVerified(listingId, ticketId, false);
                    emit ListingCancelled(listingId, listing.seller);
                }
                
                // Clear the association between requestId and listingId
                delete requestToListing[requestId];
            }
        }
    }
}