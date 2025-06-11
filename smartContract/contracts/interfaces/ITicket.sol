// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {EventDetails} from "../types/EventDetails.sol";
import {Seat} from "../types/Seat.sol";

interface ITicket {
    function initialize(
        address owner_,
        address signer_,
        address ticketLaunchpad_,
        EventDetails calldata eventDetails_
    ) external;
    function claimedSeatNumbers(
        string calldata seatNumber
    ) external returns (bool);
    function mint(address to, Seat calldata seat) external;
    function batchMint(address to, Seat[] calldata seat) external;
}
