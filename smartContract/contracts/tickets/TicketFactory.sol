// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;
import {UUPSAccessControl} from "../proxy/UUPSAccessControl.sol";
import {ITicket} from "../interfaces/ITicket.sol";
import {ITicketLaunchpad} from "../interfaces/ITicketLaunchpad.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EventDetails} from "../types/EventDetails.sol";
import {Tier} from "../types/TierInfo.sol";

/**
 * @title TicketFactory
 * @notice Factory contract for creating event Ticket NFTs along with their associated launchpad contracts.
 * @dev Utilizes minimal proxy clones for ticket and launchpad implementations to enable gas-efficient deployments.
 */
contract TicketFactory is UUPSAccessControl {
    // keccak256(abi.encode(uint256(keccak256("TICKET_FACTORY_LOCATION")) - 1)).
    bytes32 private constant TICKET_FACTORY_LOCATION =
        0xe5ebfa008bacc85f8657a926bb677f563002d5a3ca82b831785a3e95c335fd74;

    /**
     * @notice Emitted when a new Ticket and its corresponding TicketLaunchpad are created.
     * @param owner Address of the user who created the Ticket and Launchpad.
     * @param ticket Address of the newly cloned Ticket (NFT) contract.
     * @param ticketLaunchpad Address of the newly cloned TicketLaunchpad contract.
     */
    event Created(
        address indexed owner,
        address indexed ticket,
        address indexed ticketLaunchpad
    );

    /**
     * @dev Storage layout for the TicketFactory contract.
     */
    struct TicketFactoryStorage {
        address ticketImplementation;
        address ticketLaunchpadImplementation;
        address config;
        address authorizedSigner;
        mapping(address ticket => address launchpad) launchpadByTicket;
        mapping(address user => address[] ticketList) ticketListByUser;
    }

    /**
     * @notice Returns the storage pointer for the TicketFactory's dedicated storage slot.
     * @dev Uses a fixed storage slot as per EIP-1967 to avoid storage conflicts in upgradeable (UUPS) contracts.
     *      Assembly is used to manually assign the storage slot, as Solidity does not support this directly.
     * @return $ A storage pointer to the TicketFactoryStorage struct stored at the predefined slot.
     */
    function _getTicketFactoryLocation()
        internal
        pure
        returns (TicketFactoryStorage storage $)
    {
        assembly {
            $.slot := TICKET_FACTORY_LOCATION
        }
    }

    /**
     * @notice Initializes the TicketFactory contract with required implementation and configuration addresses.
     * @dev Can only be called once due to the initializer modifier (for UUPS upgradeable pattern).
     * @param ticketImplementation Address of the Ticket (NFT) implementation contract to be cloned.
     * @param ticketLaunchpadImplementation Address of the TicketLaunchpad implementation contract to be cloned.
     * @param config Address of the configuration contract containing global settings for the launchpad.
     * @param authorizedSigner Address authorized to sign ticket purchase approvals (e.g., backend signer).
     */
    function initialize(
        address ticketImplementation,
        address ticketLaunchpadImplementation,
        address config,
        address authorizedSigner
    ) external initializer {
        TicketFactoryStorage storage $ = _getTicketFactoryLocation();
        $.ticketImplementation = ticketImplementation;
        $.ticketLaunchpadImplementation = ticketLaunchpadImplementation;
        $.config = config;
        $.authorizedSigner = authorizedSigner;
    }

    /**
     * @notice Create an NFT ticket and its associated launchpad using minimal proxies.
     * @param eventDetails The event details metadata for the ticket NFT.
     * @param tierIds List of ticket tier IDs (e.g., VIP, Standard).
     * @param tierPricesUSD Prices per tier (in USD, 8 decimals following USDT decimal).
     * @param paymentTokens Allowed ERC20 tokens for ticket purchase.
     * @param priceFeeds Chainlink price feed addresses corresponding to each token.
     * @return ticket Address of the created Ticket contract.
     * @return ticketLaunchpad Address of the created TicketLaunchpad contract.
     */
    function createTicketPair(
        EventDetails calldata eventDetails,
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD,
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external returns (address ticket, address ticketLaunchpad) {
        TicketFactoryStorage storage $ = _getTicketFactoryLocation();

        // Clones the Ticket and TicketLaunchpad implementation contracts to create new minimal proxies.
        ticket = Clones.clone($.ticketImplementation);
        ticketLaunchpad = Clones.clone($.ticketLaunchpadImplementation);

        $.launchpadByTicket[ticket] = ticketLaunchpad;
        $.ticketListByUser[msg.sender].push(ticket);

        ITicket(ticket).initialize(
            msg.sender,
            $.authorizedSigner,
            ticketLaunchpad,
            eventDetails
        );

        ITicketLaunchpad(ticketLaunchpad).initialize(
            msg.sender,
            $.config,
            ticket,
            $.authorizedSigner,
            tierIds,
            tierPricesUSD,
            paymentTokens,
            priceFeeds
        );

        emit Created(msg.sender, ticket, ticketLaunchpad);
    }
}
