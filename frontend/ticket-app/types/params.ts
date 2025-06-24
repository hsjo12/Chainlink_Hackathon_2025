import { EventDetails, TierIds, TierInfo } from "./types";

export interface CreatePairParams {
  ethUsdPriceFeed: string;
  eventDetails: EventDetails;
  tierIds: TierIds;
  imageURIs: string[];
  tierInfoList: TierInfo[];
  paymentTokens: string[];
  priceFeeds: string[];
}
