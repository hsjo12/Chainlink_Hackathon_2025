// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * @dev Struct representing the details of an event for which tickets are issued.
 */
struct EventDetails {
    string name;
    string symbol;
    string coverImageURI;
    string description;
    string location;
    uint64 startTime;
    uint64 endTime;
    uint64 checkInStartTime; // Add ticket validation start time
}
