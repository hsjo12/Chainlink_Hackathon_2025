import { EventDetails, TierIds, TierInfo, Seat } from "./types";

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
