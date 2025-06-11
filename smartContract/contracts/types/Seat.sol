// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * @dev Enum representing different ticket tiers or levels.
 */
enum Tier {
    VIP, // VIP tier with premium benefits
    Standard, // Standard tier with regular access
    None // No tier assigned or general admission
}

/**
 * @dev Struct representing a specific seat in the venue.
 */
struct Seat {
    string section; // Section or area of the venue (e.g., "A", "B", "Balcony", "Left Wing")
    string seatNumber; // Specific seat identifier within the section (e.g., "A1", "B12", "R5")
    Tier tier; // Tier assigned to this seat (e.g., VIP, Standard)
}
