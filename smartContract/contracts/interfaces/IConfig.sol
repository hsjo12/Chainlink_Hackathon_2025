// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IConfig {
    function getFeeManager() external view returns (address);
    function getTreasury() external view returns (address);
    function getOrganizerRegistry() external view returns (address);
}
