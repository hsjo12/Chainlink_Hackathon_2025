// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IFunctionsRouter} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";
import {IFunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/// @title 可升级的Chainlink Functions客户端合约
/// @notice 合约开发者可以继承这个合约以便发送Chainlink Functions请求
abstract contract FunctionsClientUpgradeable is IFunctionsClient {
  using FunctionsRequest for FunctionsRequest.Request;

  IFunctionsRouter internal i_router;

  event RequestSent(bytes32 indexed id);
  event RequestFulfilled(bytes32 indexed id);

  error OnlyRouterCanFulfill();

  /// @notice 初始化函数，替代构造函数
  /// @param router Chainlink Functions路由器地址
  function __FunctionsClient_init(address router) internal {
    i_router = IFunctionsRouter(router);
  }

  /// @notice 发送Chainlink Functions请求
  /// @param data Functions请求的CBOR编码字节数据
  /// @param subscriptionId 将被收费以服务请求的订阅ID
  /// @param callbackGasLimit 回调函数可用的gas限制
  /// @return requestId 为此请求生成的请求ID
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

  /// @notice 用户定义的函数，用于处理来自DON的响应
  /// @param requestId 请求ID，由sendRequest()返回
  /// @param response 用户源代码执行的聚合响应
  /// @param err 用户代码执行或执行管道的聚合错误
  /// @dev response或err参数将被设置，但永远不会同时设置
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