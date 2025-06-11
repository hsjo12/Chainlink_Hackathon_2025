// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {EventDetails} from "../types/EventDetails.sol";
import {Seat, Tier} from "../types/Seat.sol";

interface ITicketLaunchpad {
    function initialize(
        address owner,
        address config,
        address ticket_,
        address authorizedSigner_,
        Tier[] memory tierIds,
        uint256[] calldata tierPricesUSD,
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external;
}
