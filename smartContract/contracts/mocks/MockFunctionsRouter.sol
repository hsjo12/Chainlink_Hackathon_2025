// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IFunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";

/**
 * @title MockFunctionsRouter
 * @notice Mock contract for testing Chainlink Functions integration
 */
contract MockFunctionsRouter {
    event RequestSent(bytes32 indexed requestId, address indexed sender);
    event RequestFulfilled(bytes32 indexed requestId, address indexed client);

    constructor() {}

    function sendRequest(
        uint64 /* subscriptionId */,
        bytes calldata data,
        uint16 /* dataVersion */,
        uint32 /* callbackGasLimit */,
        bytes32 /* donId */
    ) external returns (bytes32) {
        bytes32 requestId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, data)
        );
        emit RequestSent(requestId, msg.sender);
        return requestId;
    }

    function fulfillRequest(
        bytes32 requestId,
        address client,
        bytes memory response,
        bytes memory err
    ) external returns (bool) {
        IFunctionsClient(client).handleOracleFulfillment(requestId, response, err);
        emit RequestFulfilled(requestId, client);
        return true;
    }

    // Add required interface functions that FunctionsClient expects
    function getProposedContractById(bytes32) external pure returns (address) {
        return address(0);
    }

    function getContractById(bytes32) external pure returns (address) {
        return address(0);
    }
}
