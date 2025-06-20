// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title TestTicketInfoConsumer
 * @notice Simplified test version of TicketInfoConsumer for local testing
 */
contract TestTicketInfoConsumer is ConfirmedOwner {
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    uint256 public remainingTickets;
    mapping(string => bool) public ticketUsageStatus;
    string public s_lastCheckedTicketId;
    bool public s_lastTicketUsed;

    error UnexpectedRequestID(bytes32 requestId);
    error InvalidTicketID(string ticketId);

    event Response(
        bytes32 indexed requestId,
        uint256 remainingTickets,
        bytes rawResponse,
        bytes error
    );

    event TicketVerified(
        bytes32 indexed requestId,
        string ticketId,
        bool isUsed,
        bytes rawResponse,
        bytes error
    );

    constructor() ConfirmedOwner(msg.sender) {}

    function requestRemainingTickets(
        uint64 /* subscriptionId */,
        string[] calldata /* args */
    ) external onlyOwner returns (bytes32 requestId) {
        s_lastRequestId = keccak256(
            abi.encodePacked(block.timestamp, "availability")
        );
        return s_lastRequestId;
    }

    function verifyTicketUsage(
        uint64 /* subscriptionId */,
        string calldata ticketId
    ) external onlyOwner returns (bytes32 requestId) {
        if (bytes(ticketId).length == 0) {
            revert InvalidTicketID(ticketId);
        }

        s_lastCheckedTicketId = ticketId;
        s_lastRequestId = keccak256(
            abi.encodePacked(block.timestamp, "verification", ticketId)
        );
        return s_lastRequestId;
    }

    function testFulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) public {
        if (requestId != s_lastRequestId) {
            revert UnexpectedRequestID(requestId);
        }

        s_lastResponse = response;
        s_lastError = err;

        if (bytes(s_lastCheckedTicketId).length > 0) {
            // Process ticket verification response
            if (err.length == 0 && response.length >= 32) {
                uint256 isUsedInt = abi.decode(response, (uint256));
                bool isUsed = isUsedInt > 0;

                ticketUsageStatus[s_lastCheckedTicketId] = isUsed;
                s_lastTicketUsed = isUsed;

                emit TicketVerified(
                    requestId,
                    s_lastCheckedTicketId,
                    isUsed,
                    response,
                    err
                );
                s_lastCheckedTicketId = "";
            } else {
                emit TicketVerified(
                    requestId,
                    s_lastCheckedTicketId,
                    false,
                    response,
                    err
                );
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

    function isTicketUsed(
        string calldata ticketId
    ) external view returns (bool) {
        return ticketUsageStatus[ticketId];
    }
}
