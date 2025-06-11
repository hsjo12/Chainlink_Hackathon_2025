// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IFeeManager {
    function calculateFee(uint256 amount) external view returns (uint256);
}
