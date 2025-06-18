// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {EventDetails} from "../types/EventDetails.sol";
import {Seat} from "../types/Seat.sol";
import {Tier} from "../types/TierInfo.sol";
interface ITicket {
    function initialize(
        address owner_,
        address ticketLaunchpad_,
        EventDetails calldata eventDetails_,
        Tier[] memory tierIds,
        string[] calldata imageURIs
    ) external;
    function claimedSeatNumbers(
        string calldata seatNumber
    ) external returns (bool);
    function mint(address to, Seat calldata seat) external;
    function batchMint(address to, Seat[] calldata seat) external;
}
