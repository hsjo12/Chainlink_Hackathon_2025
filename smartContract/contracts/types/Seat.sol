// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Tier} from "./TierInfo.sol";

/**
 * @dev Struct representing a specific seat in the venue.
 */
struct Seat {
    string section; // Section or area of the venue (e.g., "A", "B", "Balcony", "Left Wing")
    string seatNumber; // Specific seat identifier within the section (e.g., "A1", "B12", "R5")
    Tier tier; // Tier assigned to this seat (e.g., VIP, Standard)
}
