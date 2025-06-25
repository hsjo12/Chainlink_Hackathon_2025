// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IFunctionsRouter} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";
import {IFunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/// @title Upgradeable Chainlink Functions Client Contract
/// @notice Contract developers can inherit this contract to send Chainlink Functions requests
abstract contract FunctionsClientUpgradeable is IFunctionsClient {
  using FunctionsRequest for FunctionsRequest.Request;

  IFunctionsRouter internal i_router;

  event RequestSent(bytes32 indexed id);
  event RequestFulfilled(bytes32 indexed id);

  error OnlyRouterCanFulfill();

  /// @notice Initialization function, replaces constructor
  /// @param router Chainlink Functions router address
  function __FunctionsClient_init(address router) internal {
    i_router = IFunctionsRouter(router);
  }

  /// @notice Send Chainlink Functions request
  /// @param data CBOR encoded bytes data for Functions request
  /// @param subscriptionId Subscription ID that will be charged to service the request
  /// @param callbackGasLimit Gas limit for the callback function
  /// @return requestId Request ID generated for this request
  function _sendRequest(
    bytes memory data,
    uint64 subscriptionId,
    uint32 callbackGasLimit,
    bytes32 donId
  ) internal returns (bytes32) {
    bytes32 requestId = i_router.sendRequest(
      subscriptionId,
      data,
      FunctionsRequest.REQUEST_DATA_VERSION,
      callbackGasLimit,
      donId
    );
    emit RequestSent(requestId);
    return requestId;
  }

  /// @notice User-defined function to handle responses from DON
  /// @param requestId Request ID returned by sendRequest()
  /// @param response Aggregated response from user source code execution
  /// @param err Aggregated error from user code execution or execution pipeline
  /// @dev response or err parameter will be set, but never both
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal virtual;

  /// @inheritdoc IFunctionsClient
  function handleOracleFulfillment(bytes32 requestId, bytes memory response, bytes memory err) external override {
    if (msg.sender != address(i_router)) {
      revert OnlyRouterCanFulfill();
    }
    fulfillRequest(requestId, response, err);
    emit RequestFulfilled(requestId);
  }
}