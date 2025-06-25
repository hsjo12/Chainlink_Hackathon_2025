// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IOwnable} from "@chainlink/contracts/src/v0.8/shared/interfaces/IOwnable.sol";

/// @title Upgradeable ConfirmedOwner Contract
/// @notice A contract with basic contract ownership helper functions
contract ConfirmedOwnerUpgradeable is IOwnable {
  address private s_owner;
  address private s_pendingOwner;

  event OwnershipTransferRequested(address indexed from, address indexed to);
  event OwnershipTransferred(address indexed from, address indexed to);

  /// @notice Initialization function, replaces constructor
  /// @param newOwner Address of the new owner
  function __ConfirmedOwner_init(address newOwner) internal {
    require(newOwner != address(0), "Cannot set owner to zero");
    s_owner = newOwner;
  }

  /// @notice Allows owner to begin transferring ownership to a new address
  function transferOwnership(address to) public override onlyOwner {
    _transferOwnership(to);
  }

  /// @notice Allows recipient to complete ownership transfer
  function acceptOwnership() external override {
    require(msg.sender == s_pendingOwner, "Must be proposed owner");

    address oldOwner = s_owner;
    s_owner = msg.sender;
    s_pendingOwner = address(0);

    emit OwnershipTransferred(oldOwner, msg.sender);
  }

  /// @notice Get the current owner
  function owner() public view override returns (address) {
    return s_owner;
  }

  /// @notice Validate, transfer ownership and emit related events
  function _transferOwnership(address to) private {
    require(to != msg.sender, "Cannot transfer to self");

    s_pendingOwner = to;

    emit OwnershipTransferRequested(s_owner, to);
  }

  /// @notice Validate access permission
  function _validateOwnership() internal view {
    require(msg.sender == s_owner, "Only callable by owner");
  }

  /// @notice Reverts if not called by contract owner
  modifier onlyOwner() {
    _validateOwnership();
    _;
  }
}