// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./SecondaryMarketCore.sol";
import "../tickets/Ticket.sol";

/**
 * @title   SecondaryMarketPurchase
 * @notice  Handles purchase functionality for listings
 * @dev     Extends SecondaryMarketCore with purchase-specific operations
 */
contract SecondaryMarketPurchase is SecondaryMarketCore {
    /**
     * @notice Purchases an NFT from a listing
     * @param listingId ID of the listing to purchase
     */
    function purchaseListing(uint256 listingId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        validListing(listingId) 
    {
        Listing storage listing = listings[listingId];
        
        if (msg.value < listing.price) revert InsufficientPayment();
        
        // Check if the event has ended
        if (bytes(listing.ticketId).length > 0) {
            Ticket ticketContract = Ticket(listing.nftContract);
            uint64 eventEndTime = ticketContract.endTime();
            
            if (block.timestamp > eventEndTime) {
                revert EventEnded();
            }
        }
            
        // Mark listing as inactive
        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;
        
        // Update ticket status to SOLD
        if (bytes(listing.ticketId).length > 0) {
            ticketStatus[listing.ticketId] = TicketStatus.SOLD;
            emit TicketStatusUpdated(listing.ticketId, TicketStatus.SOLD);
        }
        
        // Calculate fees
        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // Transfer payment
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        (bool sellerSuccess, ) = listing.seller.call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();
        
        // Return any extra payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - listing.price}("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit ListingPurchased(
            listingId,
            msg.sender,
            listing.seller,
            listing.price
        );
    }
}