// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../utils/Counters.sol";
import "./SecondaryMarketCore.sol";
import "../tickets/Ticket.sol";

/**
 * @title   SecondaryMarketListing
 * @notice  Handles listing creation and cancellation functionality
 * @dev     Extends SecondaryMarketCore with listing-specific operations
 */
contract SecondaryMarketListing is SecondaryMarketCore {
    using Counters for Counters.Counter;
    /**
     * @notice Creates a new NFT listing with event time verification
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     * @param duration Listing duration in seconds
     * @param ticketId Ticket ID for verification
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 duration,
        string calldata ticketId
    ) external whenNotPaused nonReentrant {
        if (price == 0) revert InvalidPrice();
        if (duration < minListingDuration || duration > maxListingDuration) {
            revert InvalidDuration();
        }
        if (!supportedContracts[nftContract]) revert UnsupportedContract();
        if (tokenToListing[nftContract][tokenId] != 0) revert TokenAlreadyListed();
        
        // Check ticket status, only allow FRESH or DELISTED/SOLD status tickets to be listed
        if (bytes(ticketId).length > 0) {
            TicketStatus status = ticketStatus[ticketId];
            if (status != TicketStatus.FRESH && status != TicketStatus.DELISTED && status != TicketStatus.SOLD) {
                revert TicketNotFresh(ticketId);
            }
        }
        
        IERC721 nft = IERC721(nftContract);
        
        // Verify ownership and approval
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!nft.isApprovedForAll(msg.sender, address(this)) && 
            nft.getApproved(tokenId) != address(this)) {
            revert TokenNotApproved();
        }
        
        // Check if the event has ended (alternative to checking if the ticket has been used)
        if (bytes(ticketId).length > 0) {
            // Assume nftContract is a Ticket contract
            Ticket ticketContract = Ticket(nftContract);
            uint64 eventEndTime = ticketContract.endTime();
            
            if (block.timestamp > eventEndTime) {
                revert EventEnded();
            }
        }

        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // Modification: Set to pending verification status instead of directly activating
        bool isActive = false;
        bool isPendingVerification = true;
        
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            startTime: startTime,
            endTime: endTime,
            active: isActive,
            ticketId: ticketId,
            pendingVerification: isPendingVerification
        });
        
        tokenToListing[nftContract][tokenId] = listingId;
        
        // Store ticket ID mapping
        if (bytes(ticketId).length > 0) {
            listingToTicketId[listingId] = ticketId;
            // Update ticket status to PENDING instead of ACTIVE
            ticketStatus[ticketId] = TicketStatus.PENDING;
            emit TicketStatusUpdated(ticketId, TicketStatus.PENDING);
            
            // Send Chainlink verification request
            bytes32 requestId = verifyTicketUsage(subscriptionId, ticketId);
            requestToListing[requestId] = listingId;
            emit TicketVerificationRequested(listingId, ticketId, requestId);
        } else {
            // If no ticket ID, activate the listing directly
            listings[listingId].active = true;
            listings[listingId].pendingVerification = false;
        }
        
        emit ListingCreated(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            startTime,
            endTime,
            ticketId
        );
    }
    
    /**
     * @notice Cancels an active listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Listing storage listing = listings[listingId];
        
        if (listing.listingId == 0) revert ListingNotFound();
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();
        
        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;
        
        // Update ticket status to DELISTED
        if (bytes(listing.ticketId).length > 0) {
            ticketStatus[listing.ticketId] = TicketStatus.DELISTED;
            emit TicketStatusUpdated(listing.ticketId, TicketStatus.DELISTED);
        }
        
        emit ListingCancelled(listingId, msg.sender);
    }
}