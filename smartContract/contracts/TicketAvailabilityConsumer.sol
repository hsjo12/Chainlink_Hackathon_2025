// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title TicketAvailabilityConsumer
 * @notice This contract uses Chainlink Functions to fetch the remaining ticket count and verify ticket usage status from an off-chain API.
 * @dev Designed to run on the Sepolia testnet. Requires a Chainlink Functions subscription and valid DON configuration.
 */
contract TicketAvailabilityConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    /// @notice Latest number of remaining tickets fetched from the API
    uint256 public remainingTickets;
    
    /// @notice Mapping to store ticket usage status (ticketId => isUsed)
    mapping(string => bool) public ticketUsageStatus;
    
    /// @notice Last ticket ID that was checked
    string public s_lastCheckedTicketId;
    
    /// @notice Last ticket usage status
    bool public s_lastTicketUsed;

    /// @dev Custom error for mismatched request fulfillment
    error UnexpectedRequestID(bytes32 requestId);
    
    /// @dev Custom error for invalid ticket ID
    error InvalidTicketID(string ticketId);

    /// @notice Emitted when a Chainlink Functions request is fulfilled for availability check
    event Response(
        bytes32 indexed requestId,
        uint256 remainingTickets,
        bytes rawResponse,
        bytes error
    );
    
    /// @notice Emitted when a ticket usage status is verified
    event TicketVerified(
        bytes32 indexed requestId,
        string ticketId,
        bool isUsed,
        bytes rawResponse,
        bytes error
    );

    /// @notice Chainlink Functions Router address on Sepolia
    address constant ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    /// @notice DON ID for Sepolia Chainlink Functions network
    bytes32 constant DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    /// @notice Max gas limit for Chainlink Functions callback
    uint32 constant GAS_LIMIT = 300000;

    /**
     * @notice Inline JavaScript source code for Chainlink Functions to check availability
     * @dev Fetches all tickets, finds the one with matching ID, returns its `remaining` value as uint256
     */
    string availabilitySource = 
    "const eventId = args[0];"
    "const url = 'https://6841cf3ad48516d1d35cf71c.mockapi.io/tickets/' + eventId;"
    "const response = await Functions.makeHttpRequest({ url });"
    "if (response.error) { throw Error('Request failed'); }"
    "const data = response.data;"
    "if (!data || typeof data !== 'object') throw Error(`Invalid response`);"
    "const rawRemaining = data.remaining;"
    "const available = Number(rawRemaining);"
    "if (!Number.isFinite(available)) throw Error(`Invalid ticket count: ${rawRemaining}`);"
    "return Functions.encodeUint256(available);";

    /**
     * @notice Inline JavaScript source code for Chainlink Functions to verify ticket usage
     * @dev Fetches ticket data and checks if the specified ticket has been used
     */
    string ticketVerificationSource =
    "const ticketId = args[0];"
    "const url = 'https://6841cf3ad48516d1d35cf71c.mockapi.io/verifytickets/' + ticketId;"
    "const response = await Functions.makeHttpRequest({ url });"
    "if (response.error) { throw Error('Request failed'); }"
    "const data = response.data;"
    "if (!data || typeof data !== 'object') throw Error(`Ticket ID ${ticketId} not found or invalid`);"
    "const isUsed = data.used === true;"
    "return Functions.encodeUint256(isUsed ? 1 : 0);";

    /**
     * @notice Constructor sets up Chainlink Functions client and ownership
     */
    constructor() FunctionsClient(ROUTER) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Sends a Chainlink Functions request to fetch remaining ticket count
     * @param subscriptionId Your Chainlink Functions subscription ID
     * @param args Function arguments; args[0] should be the event ID string
     * @return requestId The ID of the request sent
     */
    function requestRemainingTickets(
        uint64 subscriptionId,
        string[] calldata args
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(availabilitySource);
        if (args.length > 0) req.setArgs(args);

        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT,
            DON_ID
        );

        return s_lastRequestId;
    }
    
    /**
     * @notice Sends a Chainlink Functions request to verify if a ticket has been used
     * @param subscriptionId Your Chainlink Functions subscription ID
     * @param ticketId The ID of the ticket to verify
     * @return requestId The ID of the request sent
     */
    function verifyTicketUsage(
        uint64 subscriptionId,
        string calldata ticketId
    ) external onlyOwner returns (bytes32 requestId) {
        if (bytes(ticketId).length == 0) {
            revert InvalidTicketID(ticketId);
        }
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(ticketVerificationSource);
        
        string[] memory args = new string[](1);
        args[0] = ticketId;
        req.setArgs(args);
        
        s_lastCheckedTicketId = ticketId;
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT,
            DON_ID
        );

        return s_lastRequestId;
    }

    /**
     * @notice Callback function called by Chainlink nodes after request is fulfilled
     * @param requestId The request ID being fulfilled
     * @param response The raw response returned from the JavaScript function
     * @param err Any error message returned during execution
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (requestId != s_lastRequestId) {
            revert UnexpectedRequestID(requestId);
        }

        s_lastResponse = response;
        s_lastError = err;

        // Check if this is a ticket verification request
        if (bytes(s_lastCheckedTicketId).length > 0) {
            // Process ticket verification response
            if (err.length == 0 && response.length >= 32) {
                uint256 isUsedInt = abi.decode(response, (uint256));
                bool isUsed = isUsedInt > 0;
                
                // Update the ticket usage status
                ticketUsageStatus[s_lastCheckedTicketId] = isUsed;
                s_lastTicketUsed = isUsed;
                
                emit TicketVerified(requestId, s_lastCheckedTicketId, isUsed, response, err);
                
                // Reset the last checked ticket ID
                s_lastCheckedTicketId = "";
            } else {
                emit TicketVerified(requestId, s_lastCheckedTicketId, false, response, err);
                s_lastCheckedTicketId = "";
            }
        } else {
            // Process availability check response
            if (err.length == 0 && response.length >= 32) {
                remainingTickets = abi.decode(response, (uint256));
            }
            
            emit Response(requestId, remainingTickets, response, err);
        }
    }
    
    /**
     * @notice Check if a ticket has been used (returns cached result)
     * @param ticketId The ID of the ticket to check
     * @return isUsed Whether the ticket has been used
     */
    function isTicketUsed(string calldata ticketId) external view returns (bool) {
        return ticketUsageStatus[ticketId];
    }
}