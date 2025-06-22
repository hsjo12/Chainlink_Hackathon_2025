// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {EventDetails} from "../types/EventDetails.sol";
import {Tier, TierInfo} from "../types/TierInfo.sol";

interface ITicketLaunchpad {
    function initialize(
        address owner,
        address ethUSDPriceFeed,
        address config,
        address ticket_,
        address authorizedSigner_,
        Tier[] memory tierIds,
        TierInfo[] calldata tierInfoList,
        address[] memory paymentTokens,
        address[] calldata priceFeeds
    ) external;
}
