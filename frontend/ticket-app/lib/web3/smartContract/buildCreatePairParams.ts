import {
  ETH_USD_PRICE_FEED,
  STANDARD,
  STANDING,
  VIP,
} from "@/constants/constants";
import { EventDetails, TicketType, TierInfo } from "@/types/types";
import { ethers } from "ethers";

export function buildEventDetails(
  title: string,
  symbol: string,
  imagePreview: string | null,
  description: string,
  location: string,
  startDate: string,
  endDate: string
): EventDetails {
  return [
    title, // name
    symbol, // symbol
    imagePreview ?? "", // baseURI
    description, // contractURI
    location, // description
    Math.floor(new Date(startDate).getTime() / 1000),
    Math.floor(new Date(endDate).getTime() / 1000),
  ];
}

function buildTierIds(ticketTypes: TicketType[]): number[] {
  return ticketTypes.map((v) => {
    const name = v.name.toLowerCase();
    if (name === "vip") return VIP;
    else if (name === "standard") return STANDARD;
    else return STANDING;
  });
}

export function buildImageURIs(
  ticketImageByTier: string[] | null,
  imagePreview: string | null,
  count: number
): string[] {
  return ticketImageByTier
    ? ticketImageByTier
    : imagePreview
    ? Array(count).fill(imagePreview)
    : Array(count).fill("");
}

export function buildTierInfoList(ticketTypes: TicketType[]): TierInfo[] {
  return ticketTypes.map((ticket) => [
    ethers.parseUnits(String(parseInt(ticket.price)), 8),
    parseInt(ticket.quantity),
    0,
    false, // currently no seat number option, so false
  ]);
}

export function buildPaymentAndFeeds(
  selected: string[],
  allCryptos: {
    id: string;
    address: string;
    priceFeed: string;
  }[]
): { paymentTokens: string[]; priceFeeds: string[] } {
  const tokens: string[] = [];
  const feeds: string[] = [];
  selected.forEach((id) => {
    if (id.toLowerCase() === "eth") return;
    const coin = allCryptos.find((c) => c.id === id);
    if (coin) {
      tokens.push(coin.address);
      feeds.push(coin.priceFeed);
    }
  });
  return { paymentTokens: tokens, priceFeeds: feeds };
}

export function buildCreatePairParams(
  title: string,
  symbol: string,
  imagePreview: string | null,
  description: string,
  location: string,
  startDate: string,
  endDate: string,
  ticketImageByTier: string[] | null,
  ticketTypes: TicketType[],
  selectedCryptos: string[],
  allCryptos: { id: string; address: string; priceFeed: string }[]
) {
  const eventDetails = buildEventDetails(
    title,
    symbol,
    imagePreview,
    description,
    location,
    startDate,
    endDate
  );
  const tierIds = buildTierIds(ticketTypes);
  const imageURIs = buildImageURIs(
    ticketImageByTier,
    imagePreview,
    ticketTypes.length
  );
  const tierInfoList = buildTierInfoList(ticketTypes);
  const { paymentTokens, priceFeeds } = buildPaymentAndFeeds(
    selectedCryptos,
    allCryptos
  );

  return {
    ethUsdPriceFeed: ETH_USD_PRICE_FEED,
    eventDetails,
    tierIds,
    imageURIs,
    tierInfoList,
    paymentTokens,
    priceFeeds,
  };
}
