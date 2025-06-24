// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./SecondaryMarketCore.sol";

/**
 * @title   SecondaryMarketAdmin
 * @notice  Handles administrative functions for the secondary market
 * @dev     Extends SecondaryMarketCore with admin-specific operations
 */
contract SecondaryMarketAdmin is SecondaryMarketCore {
    /**
     * @notice Updates the Chainlink Functions subscription ID
     * @param newSubscriptionId New subscription ID
     */
    function setSubscriptionId(uint64 newSubscriptionId) 
        external 
        onlyRole(MANAGER) 
    {
        subscriptionId = newSubscriptionId;
    }
    
    /**
     * @notice Updates the platform fee percentage
     * @param newFeePercent New fee percentage in basis points
     */
    function setPlatformFee(uint256 newFeePercent) 
        external 
        onlyRole(MANAGER) 
    {
        if (newFeePercent > 1000) revert InvalidFeePercent(); // Max 10%
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }
    
    /**
     * @notice Updates the fee recipient address
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) 
        external 
        onlyRole(MANAGER) 
    {
        if (newFeeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }
    
    /**
     * @notice Updates support status for an NFT contract
     * @param nftContract Address of the NFT contract
     * @param supported Whether the contract is supported
     */
    function setSupportedContract(address nftContract, bool supported) 
        external 
        onlyRole(MANAGER) 
    {
        supportedContracts[nftContract] = supported;
        emit ContractSupportUpdated(nftContract, supported);
    }
    
    /**
     * @notice Updates listing duration limits
     * @param newMinDuration New minimum listing duration
     * @param newMaxDuration New maximum listing duration
     */
    function setListingDurationLimits(
        uint256 newMinDuration,
        uint256 newMaxDuration
    ) external onlyRole(MANAGER) {
        if (newMinDuration == 0 || newMaxDuration <= newMinDuration) {
            revert InvalidDuration();
        }
        minListingDuration = newMinDuration;
        maxListingDuration = newMaxDuration;
    }
    
    /**
     * @notice Pauses the contract
     */
    function pause() external onlyRole(MANAGER) {
        _pause();
    }
    
    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(MANAGER) {
        _unpause();
    }
    
    /**
     * @notice Emergency function to cancel any listing (admin only)
     * @param listingId ID of the listing to cancel
     */
    function emergencyCancelListing(uint256 listingId) 
        external 
        onlyRole(MANAGER) 
    {
        Listing storage listing = listings[listingId];
        if (listing.listingId == 0) revert ListingNotFound();
        
        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;
        
        // Update ticket status to DELISTED
        if (bytes(listing.ticketId).length > 0) {
            ticketStatus[listing.ticketId] = TicketStatus.DELISTED;
            emit TicketStatusUpdated(listing.ticketId, TicketStatus.DELISTED);
        }
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @notice Manually set ticket status (admin only)
     * @param ticketId Ticket ID to update
     * @param status New status to set
     */
    function setTicketStatus(string calldata ticketId, TicketStatus status) 
        external 
        onlyRole(MANAGER) 
    {
        ticketStatus[ticketId] = status;
        emit TicketStatusUpdated(ticketId, status);
    }
}