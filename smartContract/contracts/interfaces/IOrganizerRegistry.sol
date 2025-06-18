// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IOrganizerRegistry {
    function checkOrganizer(address user) external view returns (bool);
}
