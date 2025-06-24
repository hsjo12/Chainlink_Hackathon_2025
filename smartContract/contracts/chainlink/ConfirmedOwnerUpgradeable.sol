// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IOwnable} from "@chainlink/contracts/src/v0.8/shared/interfaces/IOwnable.sol";

/// @title 可升级的ConfirmedOwner合约
/// @notice 一个带有基本合约所有权辅助函数的合约
contract ConfirmedOwnerUpgradeable is IOwnable {
  address private s_owner;
  address private s_pendingOwner;

  event OwnershipTransferRequested(address indexed from, address indexed to);
  event OwnershipTransferred(address indexed from, address indexed to);

  /// @notice 初始化函数，替代构造函数
  /// @param newOwner 新的所有者地址
  function __ConfirmedOwner_init(address newOwner) internal {
    require(newOwner != address(0), "Cannot set owner to zero");
    s_owner = newOwner;
  }

  /// @notice 允许所有者开始将所有权转移到新地址
  function transferOwnership(address to) public override onlyOwner {
    _transferOwnership(to);
  }

  /// @notice 允许接收者完成所有权转移
  function acceptOwnership() external override {
    require(msg.sender == s_pendingOwner, "Must be proposed owner");

    address oldOwner = s_owner;
    s_owner = msg.sender;
    s_pendingOwner = address(0);

    emit OwnershipTransferred(oldOwner, msg.sender);
  }

  /// @notice 获取当前所有者
  function owner() public view override returns (address) {
    return s_owner;
  }

  /// @notice 验证、转移所有权并发出相关事件
  function _transferOwnership(address to) private {
    require(to != msg.sender, "Cannot transfer to self");

    s_pendingOwner = to;

    emit OwnershipTransferRequested(s_owner, to);
  }

  /// @notice 验证访问权限
  function _validateOwnership() internal view {
    require(msg.sender == s_owner, "Only callable by owner");
  }

  /// @notice 如果不是合约所有者调用则回退
  modifier onlyOwner() {
    _validateOwnership();
    _;
  }
}