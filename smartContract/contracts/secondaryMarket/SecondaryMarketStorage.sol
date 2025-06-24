// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../utils/Counters.sol";
import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "../ticketInfo/TicketInfoConsumer.sol";

/**
 * @title   SecondaryMarketStorage
 * @notice  Storage contract for the secondary market system
 * @dev     Contains all state variables and events for the secondary market
 */
contract SecondaryMarketStorage is TicketInfoConsumer {
    using Counters for Counters.Counter;

    // ============ State Variables ============
    
    /// @notice Counter for listing IDs
    Counters.Counter internal _listingIds;
    
    /// @notice Platform fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public platformFeePercent;
    
    /// @notice Platform fee recipient
    address public feeRecipient;
    
    /// @notice Minimum listing duration in seconds
    uint256 public minListingDuration;
    
    /// @notice Maximum listing duration in seconds
    uint256 public maxListingDuration;
    
    /// @notice Chainlink Functions subscription ID for ticket verification
    uint64 public subscriptionId;

    // ============ Structs ============
    
    // Add ticket status enum
    enum TicketStatus {
        FRESH,      // New ticket, never listed
        PENDING,    // Pending verification
        ACTIVE,     // In active listing
        SOLD,       // Sold
        DELISTED    // Delisted
    }
    
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        bool active;
        string ticketId; // Ticket ID field
        bool pendingVerification; // Indicates if the listing is in pending verification status
    }

    // ============ Mappings ============
    
    /// @notice Mapping from listing ID to listing details
    mapping(uint256 => Listing) internal listings;
    
    /// @notice Mapping from NFT contract + token ID to listing ID
    mapping(address => mapping(uint256 => uint256)) internal tokenToListing;
    
    /// @notice Mapping to track if an NFT contract is supported
    mapping(address => bool) public supportedContracts;
    
    /// @notice Mapping from listing ID to ticket ID
    mapping(uint256 => string) internal listingToTicketId;
    
    /// @notice Mapping from ticket ID to ticket status
    mapping(string => TicketStatus) internal ticketStatus;
    
    /// @notice Mapping from request ID to listing ID
    mapping(bytes32 => uint256) internal requestToListing;

    // ============ Events ============
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 startTime,
        uint256 endTime,
        string ticketId
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    event ListingPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event PlatformFeeUpdated(uint256 newFeePercent);
    event FeeRecipientUpdated(address newFeeRecipient);
    event ContractSupportUpdated(address nftContract, bool supported);
    event TicketVerificationRequested(uint256 indexed listingId, string ticketId, bytes32 requestId);
    event ListingVerified(
        uint256 indexed listingId,
        string ticketId,
        bool verified
    );
    event TicketStatusUpdated(string ticketId, TicketStatus status);
    
    // ============ Errors ============
    
    error InvalidPrice();
    error InvalidDuration();
    error NotTokenOwner();
    error TokenNotApproved();
    error ListingNotFound();
    error ListingNotActive();
    error ListingExpired();
    error NotSeller();
    error InsufficientPayment();
    error UnsupportedContract();
    error TokenAlreadyListed();
    error TransferFailed();
    error InvalidFeePercent();
    error ZeroAddress();
    error TicketAlreadyUsed(string ticketId);
    error EventEnded();
    error TicketNotFresh(string ticketId);

    // ============ Modifiers ============
    
    modifier validListing(uint256 listingId) {
        if (listings[listingId].listingId == 0) revert ListingNotFound();
        if (!listings[listingId].active) revert ListingNotActive();
        if (listings[listingId].pendingVerification) revert ListingNotActive(); // Listings in pending verification cannot be purchased
        if (block.timestamp > listings[listingId].endTime) revert ListingExpired();
        _;
    }
}