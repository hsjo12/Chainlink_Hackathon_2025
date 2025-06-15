// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../proxy/UUPSAccessControl.sol";
import "../ticketInfo/TicketInfoConsumer.sol";

/**
 * @title Market
 * @notice NFT marketplace contract supporting ERC721A tokens with ticket verification
 * @dev Allows users to list, buy, and cancel NFT listings with ticket usage verification
 */
contract Market is 
    UUPSAccessControl,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    TicketInfoConsumer
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // ============ State Variables ============
    
    /// @notice Counter for listing IDs
    CountersUpgradeable.Counter private _listingIds;
    
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
    
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        bool active;
        string ticketId; // Added ticket ID field
    }

    // ============ Mappings ============
    
    /// @notice Mapping from listing ID to listing details
    mapping(uint256 => Listing) public listings;
    
    /// @notice Mapping from NFT contract + token ID to listing ID
    mapping(address => mapping(uint256 => uint256)) public tokenToListing;
    
    /// @notice Mapping to track if an NFT contract is supported
    mapping(address => bool) public supportedContracts;
    
    /// @notice Mapping from listing ID to ticket ID
    mapping(uint256 => string) public listingToTicketId;

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
    error InvalidTicketID(string ticketId);

    // ============ Modifiers ============
    
    modifier validListing(uint256 listingId) {
        if (listings[listingId].listingId == 0) revert ListingNotFound();
        if (!listings[listingId].active) revert ListingNotActive();
        if (block.timestamp > listings[listingId].endTime) revert ListingExpired();
        _;
    }

    // ============ Initializer ============
    
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
        FunctionsClient.__FunctionsClient_init(_router);
        ConfirmedOwner.__ConfirmedOwner_init(msg.sender);
        
        feeRecipient = _feeRecipient;
        platformFeePercent = _platformFeePercent;
        minListingDuration = _minListingDuration;
        maxListingDuration = _maxListingDuration;
        subscriptionId = _subscriptionId;
    }

    // ============ External Functions ============
    
    /**
     * @notice Creates a new NFT listing with optional ticket verification
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     * @param duration Listing duration in seconds
     * @param ticketId Optional ticket ID for verification (empty string if not needed)
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
        
        IERC721Upgradeable nft = IERC721Upgradeable(nftContract);
        
        // Verify ownership and approval
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!nft.isApprovedForAll(msg.sender, address(this)) && 
            nft.getApproved(tokenId) != address(this)) {
            revert TokenNotApproved();
        }
        
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // If ticket ID is provided, verify ticket usage
        bytes32 requestId;
        if (bytes(ticketId).length > 0) {
            // Check cached status first
            if (ticketUsageStatus[ticketId]) {
                revert TicketAlreadyUsed(ticketId);
            }
            // Call verifyTicketUsage from TicketInfoConsumer
            requestId = verifyTicketUsage(subscriptionId, ticketId);
            emit TicketVerificationRequested(listingId, ticketId, requestId);
        }
        
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            startTime: startTime,
            endTime: endTime,
            active: true,
            ticketId: ticketId
        });
        
        tokenToListing[nftContract][tokenId] = listingId;
        
        // Store ticket ID mapping if provided
        if (bytes(ticketId).length > 0) {
            listingToTicketId[listingId] = ticketId;
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
     * @notice Purchases an NFT from a listing with ticket verification
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
        
        // If listing has a ticket ID, verify it's not used
        if (bytes(listing.ticketId).length > 0) {
            if (ticketUsageStatus[listing.ticketId]) {
                revert TicketAlreadyUsed(listing.ticketId);
            }
        }
        
        // Mark listing as inactive
        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;
        
        // Calculate fees
        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Transfer NFT to buyer
        IERC721Upgradeable(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // Transfer payments
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        (bool sellerSuccess, ) = listing.seller.call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();
        
        // Refund excess payment
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
        
        emit ListingCancelled(listingId, msg.sender);
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
     * @notice Gets ticket verification status for a listing
     * @param listingId ID of the listing
     * @return ticketId The ticket ID associated with the listing
     * @return isUsed Whether the ticket is used
     */
    function getListingTicketStatus(uint256 listingId) 
        external 
        view 
        returns (string memory ticketId, bool isUsed) 
    {
        Listing memory listing = listings[listingId];
        ticketId = listing.ticketId;
        if (bytes(ticketId).length > 0) {
            isUsed = ticketUsageStatus[ticketId];
        }
    }

    // ============ Admin Functions ============
    
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
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @notice Manual ticket verification for admin
     * @param ticketId Ticket ID to verify
     */
    function adminVerifyTicket(string calldata ticketId) 
        external 
        onlyRole(MANAGER) 
        returns (bytes32 requestId) 
    {
        return verifyTicketUsage(subscriptionId, ticketId);
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER) 
    {}
    
    /**
     * @notice Override verifyTicketUsage to allow market operations
     * @param subscriptionId_ Chainlink Functions subscription ID
     * @param ticketId Ticket ID to verify
     * @return requestId Request ID
     */
    function verifyTicketUsage(
        uint64 subscriptionId_,
        string calldata ticketId
    ) public override returns (bytes32 requestId) {
        // Allow both owner and manager roles to call this function
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && 
            !hasRole(MANAGER, msg.sender) && 
            owner() != msg.sender) {
            revert("Unauthorized");
        }
        
        return super.verifyTicketUsage(subscriptionId_, ticketId);
    }
}