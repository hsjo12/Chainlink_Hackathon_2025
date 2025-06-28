import { EventDetails, TierIds, TierInfo, Seat, db_ticketType } from "./types";

export interface CreatePairParams {
  ethUsdPriceFeed: string;
  eventDetails: EventDetails;
  tierIds: TierIds;
  imageURIs: string[];
  tierInfoList: TierInfo[];
  paymentTokens: string[];
  priceFeeds: string[];
}

export interface MintSignatureParams {
  launchpad: string; // launchpad address
  to: string; // Recipient address of the minted ticket
  seat: Seat; // Seat details to be minted
  nonce: number; // Unique nonce to prevent replay attacks
  deadline: number; // Expiration timestamp for the signature
  signature: string; // Off-chain signature authorizing the mint
}

export interface MintBatchSignatureParams {
  launchpad: string; // launchpad address
  to: string; // Recipient address of the minted ticket
  seats: Seat[]; // Array of seat details to be minted
  nonce: number; // Unique nonce to prevent replay attacks
  deadline: number; // Expiration timestamp for the signature
  signature: string; // Off-chain signature authorizing the mint
}

export interface dbCreateEventParams {
  title: string;
  symbol: string;
  description: string;
  imageUrl: string;
  bannerUrl: string | undefined;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  paymentTokens: string[];
  organizerAddress: string;
  ticketAddress: string;
  launchpadAddress: string;
  marketAddress: string;
  platformFeePercent: number | undefined; // default 2.5
  royaltyFeePercent: number | undefined; // default 0.1
  ticketTypes: db_ticketType[];
  externalUrl: string | undefined;
}
