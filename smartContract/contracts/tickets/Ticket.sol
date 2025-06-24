// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721ABurnableUpgradeable, ERC721AUpgradeable, IERC721AUpgradeable} from "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {EventDetails} from "../types/EventDetails.sol";
import {Tier} from "../types/TierInfo.sol";
import {Seat} from "../types/Seat.sol";
import {InvalidTime, LengthMismatch, OnlyTicketLaunchpad} from "../errors/Errors.sol";

/**
 * @title Ticket
 * @notice ERC721A-based NFT contract representing event tickets with seat information.
 */
contract Ticket is
    Initializable,
    ERC721ABurnableUpgradeable,
    OwnableUpgradeable
{
    /// @dev Ensures that only the TicketLaunchpad contract can call certain functions.
    modifier onlyTicketLaunchpad() {
        if (msg.sender != ticketLaunchpad) revert OnlyTicketLaunchpad();
        _;
    }

    /**
     *  @dev Reverts if the current block timestamp is not within the specified time window.
     *  @param startTime_ Inclusive start timestamp of the valid period.
     *  @param endTime_   Exclusive end timestamp of the valid period.
     */
    modifier onlyValidTime(uint64 startTime_, uint64 endTime_) {
        if (startTime_ > endTime_) revert InvalidTime();
        _;
    }

    address public ticketLaunchpad; // Address of the associated TicketLaunchpad contract.
    EventDetails private _eventDetails; // Event-specific metadata.

    /// @dev Mapping of tokenId to Seat information.
    mapping(uint256 tokenId => Seat seat) public seatsTokenId;

    /// @dev Mapping of tier to ticket image URI.
    mapping(Tier tier => string imageURI) public imageURIByTier;

    /// @dev Disables all initializers for implementation contract.
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the ticket contract.
     * @param owner_ The address that will have contract ownership (typically the event organizer).
     * @param ticketLaunchpad_ Launchpad contract address for primary sales.
     * @param eventDetails_ Metadata describing the event.
     */
    function initialize(
        address owner_,
        address ticketLaunchpad_,
        EventDetails calldata eventDetails_,
        Tier[] calldata tierIds,
        string[] calldata imageURIs
    )
        public
        initializer
        initializerERC721A
        onlyValidTime(eventDetails_.startTime, eventDetails_.endTime)
    {
        __ERC721A_init(eventDetails_.name, eventDetails_.symbol);
        __ERC721ABurnable_init();
        __Ownable_init(owner_);

        ticketLaunchpad = ticketLaunchpad_;
        _eventDetails = eventDetails_;
        _setImageURIsByTier(tierIds, imageURIs);
    }

    /**
     * @notice Mints a ticket NFT with the specified seat information to the recipient address.
     * @dev Only callable by the TicketLaunchpad contract.
     *      Prevents duplicate minting for non-standing seats by checking seat number.
     * @param to The address receiving the minted ticket.
     * @param seat The Seat struct containing section, seat number, and tier information.
     */
    function mint(address to, Seat calldata seat) external onlyTicketLaunchpad {
        uint256 tokenId = _nextTokenId();
        seatsTokenId[tokenId] = seat;
        _safeMint(to, 1);
    }
    /**
     * @notice Mints multiple tickets in a batch to `to`.
     * @dev Can only be called by the TicketLaunchpad.
     * @param to Recipient address.
     * @param seat Array of seat details.
     */
    function batchMint(
        address to,
        Seat[] calldata seat
    ) external onlyTicketLaunchpad {
        _batchMint(to, seat);
    }

    /**
     * @dev Mints multiple ticket NFTs with specified seat information to the recipient address.
     *      Only non-standing seats are checked for duplication to prevent double-minting.
     * @param to The address receiving the minted tickets.
     * @param seats Array of Seat structs, each containing section, seat number, and tier information.
     */
    function _batchMint(address to, Seat[] calldata seats) private {
        uint256 len = seats.length;
        uint256 tokenId = _nextTokenId();

        for (uint256 i = 0; i < len; ) {
            Seat calldata seat = seats[i];

            seatsTokenId[tokenId++] = seat;

            unchecked {
                i++;
            }
        }

        _safeMint(to, len);
    }
    /**
     * @notice Updates the event details (metadata).
     * @dev Only the owner (supposedly the event organizer) can update event details.
     * @param eventDetails_ New event details.
     */
    function setEventDetails(
        EventDetails calldata eventDetails_
    )
        external
        onlyOwner
        onlyValidTime(eventDetails_.startTime, eventDetails_.endTime)
    {
        _eventDetails = eventDetails_;
    }

    /**
     * @notice Updates the image URIs associated with each ticket tier.
     * @dev Only callable by the contract owner. Reverts if the lengths of `tierIds` and `imageURIs` do not match.
     * @param tierIds An array of Tier enums for which the image URIs will be updated.
     * @param imageURIs A parallel array of new image URI strings corresponding to each `tierId`.
     */
    function setImageURIsByTier(
        Tier[] calldata tierIds,
        string[] calldata imageURIs
    ) external onlyOwner {
        _setImageURIsByTier(tierIds, imageURIs);
    }

    /**
     * @dev Internal helper to perform the actual mapping update.
     *      Expects matching array lengths; reverts with LengthMismatch otherwise.
     * @param tierIds An array of Tier enums to iterate over.
     * @param imageURIs A parallel array of image URI strings for each tier.
     */
    function _setImageURIsByTier(
        Tier[] calldata tierIds,
        string[] calldata imageURIs
    ) private {
        uint256 len = tierIds.length;
        if (len != imageURIs.length) revert LengthMismatch();
        for (uint256 i = 0; i < len; ) {
            imageURIByTier[tierIds[i]] = imageURIs[i];
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Returns the token metadata as a JSON string.
     * @param tokenId Token ID to query.
     * @return URI string in JSON format.
     */
    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC721AUpgradeable, IERC721AUpgradeable)
        returns (string memory)
    {
        if (!_exists(tokenId)) _revert(URIQueryForNonexistentToken.selector);

        EventDetails storage eventDetails = _eventDetails;
        Seat storage seat = seatsTokenId[tokenId];

        return
            string(
                abi.encodePacked(
                    '{"name":"',
                    eventDetails.name,
                    "#",
                    _toString(tokenId),
                    '", "description":"',
                    eventDetails.description,
                    '", ',
                    '"image":"',
                    imageURIByTier[seat.tier],
                    '", ',
                    '"attributes":[',
                    '{"trait_type":"Section","value":"',
                    seat.section,
                    '"},',
                    '{"trait_type":"Seat Number","value":"',
                    seat.seatNumber,
                    '"},',
                    '{"trait_type":"Tier","value":"',
                    _tierName(seat.tier),
                    '"},',
                    '{"trait_type":"Location","value":"',
                    eventDetails.location,
                    '"},',
                    '{"trait_type":"Start Time","display_type":"date","value":',
                    _toString(eventDetails.startTime),
                    "},",
                    '{"trait_type":"End Time","display_type":"date","value":',
                    _toString(eventDetails.endTime),
                    "}",
                    "]}"
                )
            );
    }

    /// @dev Convert a Tier enum into its human name.
    function _tierName(Tier tier) private pure returns (string memory) {
        if (tier == Tier.VIP) return "VIP";
        if (tier == Tier.STANDARD) return "STANDARD";
        if (tier == Tier.STANDING) return "STANDING";
        return "";
    }

    /**
     * @dev Returns the token collection name.
     */
    function name()
        public
        view
        virtual
        override(ERC721AUpgradeable, IERC721AUpgradeable)
        returns (string memory)
    {
        return _eventDetails.name;
    }

    /**
     * @dev Returns the token collection symbol.
     */
    function symbol()
        public
        view
        virtual
        override(ERC721AUpgradeable, IERC721AUpgradeable)
        returns (string memory)
    {
        return _eventDetails.symbol;
    }

    /**
     * @notice Returns the event description.
     */
    function description() public view returns (string memory) {
        return _eventDetails.description;
    }

    /**
     * @notice Returns the event location.
     */
    function location() public view returns (string memory) {
        return _eventDetails.location;
    }

    /**
     * @notice Returns the event start timestamp.
     */
    function startTime() public view returns (uint64) {
        return _eventDetails.startTime;
    }

    /**
     * @notice Returns the event end timestamp.
     */
    function endTime() public view returns (uint64) {
        return _eventDetails.endTime;
    }
}
