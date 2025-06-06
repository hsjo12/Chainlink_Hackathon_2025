// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title TicketAvailabilityConsumer
 * @notice This contract uses Chainlink Functions to fetch the remaining ticket count from an off-chain API.
 * @dev Designed to run on the Sepolia testnet. Requires a Chainlink Functions subscription and valid DON configuration.
 */
contract TicketAvailabilityConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    /// @notice Latest number of remaining tickets fetched from the API
    uint256 public remainingTickets;

    /// @dev Custom error for mismatched request fulfillment
    error UnexpectedRequestID(bytes32 requestId);

    /// @notice Emitted when a Chainlink Functions request is fulfilled
    event Response(
        bytes32 indexed requestId,
        uint256 remainingTickets,
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
     * @notice Inline JavaScript source code for Chainlink Functions
     * @dev Fetches all tickets, finds the one with matching ID, returns its `remaining` value as uint256
     */
    string source =
        "const eventId = args[0];"
        "const response = await Functions.makeHttpRequest({"
        "  url: 'https://example.com'"
        "});"
        "if (response.error) { throw Error('Request failed'); }"
        "const data = response.data;"
        "const event = data.find(item => item.id === eventId);"
        "if (!event) throw Error(`Event ID ${eventId} not found`);"
        "const rawRemaining = event.remaining;"
        "const available = Number(rawRemaining);"
        "if (!Number.isFinite(available)) throw Error(`Invalid ticket count: ${rawRemaining}`);"
        "return Functions.encodeUint256(available);";

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
    function sendRequest(
        uint64 subscriptionId,
        string[] calldata args
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
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

        // Only decode if there was no error and response is non-empty
        if (err.length == 0 && response.length >= 32) {
            remainingTickets = abi.decode(response, (uint256));
        }

        emit Response(requestId, remainingTickets, response, err);
    }
}
