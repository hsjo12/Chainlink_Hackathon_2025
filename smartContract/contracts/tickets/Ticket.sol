// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721ABurnableUpgradeable, ERC721AUpgradeable, IERC721AUpgradeable} from "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {EventDetails} from "../types/EventDetails.sol";
import {Seat} from "../types/Seat.sol";
import {ONLY_TICKET_LAUNCHPAD, SEAT_ALREADY_CLAIMED} from "../errors/Errors.sol";

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
        if (msg.sender != ticketLaunchpad) revert ONLY_TICKET_LAUNCHPAD();
        _;
    }

    address private _authorizedSigner; // Address used to verify mint signatures.
    address public ticketLaunchpad; // Address of the associated TicketLaunchpad contract.
    EventDetails private _eventDetails; // Event-specific metadata.

    /// @dev Mapping of tokenId to Seat information.
    mapping(uint256 tokenId => Seat seat) public seatsTokenId;

    /// @dev Tracks claimed seat numbers to prevent duplication.
    mapping(string seatNumber => bool used) public claimedSeatNumbers;

    /// @dev Disables all initializers for implementation contract.
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the ticket contract.
     * @param owner_ The address that will have contract ownership (typically the event organizer).
     * @param authorizedSigner_ Address allowed to sign minting approvals.
     * @param ticketLaunchpad_ Launchpad contract address for primary sales.
     * @param eventDetails_ Metadata describing the event.
     */
    function initialize(
        address owner_,
        address authorizedSigner_,
        address ticketLaunchpad_,
        EventDetails calldata eventDetails_
    ) public initializer {
        __ERC721ABurnable_init();
        __Ownable_init(owner_);

        _authorizedSigner = authorizedSigner_;
        ticketLaunchpad = ticketLaunchpad_;
        _eventDetails = eventDetails_;
    }

    /**
     * @notice Admin-only minting function for emergency or unsold ticket minting.
     * @param to Recipient address.
     * @param seats Array of seat details.
     */
    function adminMint(address to, Seat[] calldata seats) external onlyOwner {
        _batchMint(to, seats);
    }
    /**
     * @notice Mints a single ticket NFT to `to`.
     * @dev Can only be called by the TicketLaunchpad.
     * @param to Recipient address.
     * @param seat Seat details for this ticket.
     */
    function mint(address to, Seat calldata seat) external onlyTicketLaunchpad {
        string calldata seatNumber = seat.seatNumber;
        if (claimedSeatNumbers[seatNumber]) revert SEAT_ALREADY_CLAIMED();
        claimedSeatNumbers[seatNumber] = true;
        seatsTokenId[_nextTokenId()] = seat;

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
     * @dev A private function to handle batch minting logic.
     * @param to Recipient address.
     * @param seats Array of seat details.
     */
    function _batchMint(address to, Seat[] calldata seats) private {
        uint256 len = seats.length;
        uint256 tokenId = _nextTokenId();
        string calldata seatNumber;
        for (uint256 i = 0; i < len; ) {
            seatNumber = seats[i].seatNumber;
            if (claimedSeatNumbers[seatNumber]) revert SEAT_ALREADY_CLAIMED();
            claimedSeatNumbers[seatNumber] = true;
            seatsTokenId[tokenId++] = seats[i];

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
    ) external onlyOwner {
        _eventDetails = eventDetails_;
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
                    tokenId,
                    '", "description":"',
                    eventDetails.description,
                    '", ',
                    '"image":"',
                    eventDetails.imageURI,
                    '", ',
                    '"attributes":[',
                    '{"trait_type":"Section","value":"',
                    seat.section,
                    '"},',
                    '{"trait_type":"Seat Number","value":"',
                    seat.seatNumber,
                    '"},',
                    '{"trait_type":"Tier","value":"',
                    seat.tier,
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

    /**
     * @notice Returns the event name (used as the ERC721 collection name).
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
     * @notice Returns the event symbol (used as the ERC721 collection symbol).
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
