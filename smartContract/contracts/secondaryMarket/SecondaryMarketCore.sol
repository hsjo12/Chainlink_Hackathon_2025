// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../proxy/UUPSAccessControl.sol";
import "./SecondaryMarketStorage.sol";

/**
 * @title   SecondaryMarketCore
 * @notice  Core contract for the secondary market system
 * @dev     Handles basic functionality and storage for the secondary market
 */
contract SecondaryMarketCore is 
    UUPSAccessControl,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    SecondaryMarketStorage
{
    using Counters for Counters.Counter;

    /**
     * @notice Initializes the Market contract
     * @param _feeRecipient Address to receive platform fees
     * @param _platformFeePercent Platform fee percentage in basis points
     * @param _minListingDuration Minimum listing duration in seconds
     * @param _maxListingDuration Maximum listing duration in seconds
     * @param _router Chainlink Functions router address
     * @param _subscriptionId Chainlink Functions subscription ID
     */
    function initialize(
        address _feeRecipient,
        uint256 _platformFeePercent,
        uint256 _minListingDuration,
        uint256 _maxListingDuration,
        address _router,
        uint64 _subscriptionId
    ) public initializer {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        if (_platformFeePercent > 1000) revert InvalidFeePercent(); // Max 10%
        if (_minListingDuration == 0 || _maxListingDuration <= _minListingDuration) {
            revert InvalidDuration();
        }
        
        __UUpsSet_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        // Initialize TicketInfoConsumer
        __FunctionsClient_init(_router);
        __ConfirmedOwner_init(msg.sender);
        
        feeRecipient = _feeRecipient;
        platformFeePercent = _platformFeePercent;
        minListingDuration = _minListingDuration;
        maxListingDuration = _maxListingDuration;
        subscriptionId = _subscriptionId;
    }

    // ============ View Functions ============
    
    /**
     * @notice Gets listing details by ID
     * @param listingId ID of the listing
     * @return Listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @notice Gets the current listing count
     * @return Current listing count
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingIds.current();
    }
    
    /**
     * @notice Checks if a token is currently listed
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to check
     * @return True if token is listed and active
     */
    function isTokenListed(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (bool) 
    {
        uint256 listingId = tokenToListing[nftContract][tokenId];
        if (listingId == 0) return false;
        
        Listing memory listing = listings[listingId];
        return listing.active && block.timestamp <= listing.endTime;
    }
    
    /**
     * @notice Gets ticket status for a listing
     * @param listingId ID of the listing
     * @return ticketId The ticket ID associated with the listing
     * @return status The current status of the ticket
     */
    function getListingTicketStatus(uint256 listingId) 
        external 
        view 
        returns (string memory ticketId, TicketStatus status) 
    {
        Listing memory listing = listings[listingId];
        ticketId = listing.ticketId;
        if (bytes(ticketId).length > 0) {
            status = ticketStatus[ticketId];
        }
    }

    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER) 
    {}
}