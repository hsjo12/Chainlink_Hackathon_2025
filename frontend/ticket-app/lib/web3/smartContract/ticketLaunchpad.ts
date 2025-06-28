import TicketLaunchpad from "@/smartContracts/abis/TicketLaunchpad.json";
import { getReadOnlyContract, getWriteContract } from "../provider";
import {
  CRYPTO_CURRENCIES,
  STANDARD,
  STANDING,
  VIP,
} from "@/constants/constants";
import { ethers } from "ethers";
import { MintBatchSignatureParams, MintSignatureParams } from "@/types/params";
import { TicketType, TierIds } from "@/types/types";
import { buildPaymentAndFeeds } from "./buildCreatePairParams";
import { buildTierValue } from "../utils";
import { txMessage } from "@/lib/react-tostify/popup";

export const getPriceTicket = async (
  launchpad: string,
  tier: string,
  paymentToken: string
) => {
  try {
    if (!ethers.isAddress(launchpad) || !ethers.isAddress(paymentToken))
      return 0;

    let tierType;
    tier = tier.toLowerCase();
    if (tier === "vip") tierType = VIP;
    else if (tier === "standard") tierType = STANDARD;
    else if (tier === "standing") tierType = STANDING;
    else return 0;

    const ticketLaunchpad = await getReadOnlyContract(
      launchpad,
      TicketLaunchpad.abi
    );

    const price = await ticketLaunchpad.getPriceInToken(tierType, paymentToken);

    // 1% slippage
    const priceWithSlippage = price + (price * BigInt(100)) / BigInt(10_000);
    return priceWithSlippage;
  } catch (error) {
    console.log(error);
  }
};

export const payWithETH = async (
  walletProvider: any,
  params: MintSignatureParams,
  price: number
) => {
  try {
    const { launchpad, to, seat, nonce, deadline, signature } = params;
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );

    const tx = await launchpadInstance.payWithETH(
      [launchpad, to, seat, nonce, deadline, signature],
      { value: price }
    );
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};

export const payWithToken = async (
  walletProvider: any,
  paymentToken: string | undefined,
  params: MintSignatureParams
) => {
  try {
    if (!paymentToken) throw new Error("Invalid payment token");
    const { launchpad, to, seat, nonce, deadline, signature } = params;
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );

    const tx = await launchpadInstance.payWithToken(paymentToken, [
      launchpad,
      to,
      seat,
      nonce,
      deadline,
      signature,
    ]);
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};

export const payBatchWithETH = async (
  walletProvider: any,
  params: MintBatchSignatureParams,
  price: number
) => {
  try {
    const { launchpad, to, seats, nonce, deadline, signature } = params;
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );

    const tx = await launchpadInstance.payBatchWithETH(
      [launchpad, to, seats, nonce, deadline, signature],
      { value: price }
    );
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};

export const payBatchWithToken = async (
  walletProvider: any,
  paymentToken: string | undefined,
  params: MintBatchSignatureParams
) => {
  try {
    if (!paymentToken) throw new Error("Invalid payment token");
    const { launchpad, to, seats, nonce, deadline, signature } = params;
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );

    const tx = await launchpadInstance.payBatchWithToken(paymentToken, [
      launchpad,
      to,
      seats,
      nonce,
      deadline,
      signature,
    ]);
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};

export const availableTicket = async (
  launchpad: string | undefined,
  tier: number
) => {
  try {
    if (!launchpad) return 0;
    const launchpadInstance = await getReadOnlyContract(
      launchpad,
      TicketLaunchpad.abi
    );

    const [priceUSD, maxSupply, sold, hasSeatNumbers] =
      await launchpadInstance.tierInfo(tier);

    return maxSupply - sold;
  } catch (error) {
    console.log(error);
  }
};

export const totalSoldTicket = async (
  launchpad: string | undefined,
  tier: number
) => {
  try {
    if (!launchpad) return 0;
    const launchpadInstance = await getReadOnlyContract(
      launchpad,
      TicketLaunchpad.abi
    );

    const [, , sold] = await launchpadInstance.tierInfo(tier);

    return sold;
  } catch (error) {
    console.log(error);
  }
};

export const setTierMaxSupplyPrices = async (
  launchpad: string | undefined,
  walletProvider: any,
  ticketTypes: TicketType[]
) => {
  try {
    const tierIds: TierIds = [];
    const maxSupplies: number[] = [];
    const tierPricesUSD: number[] = [];

    ticketTypes.forEach((v) => {
      tierIds.push(buildTierValue(v.name));
      maxSupplies.push(Number(v.totalSupply));
      tierPricesUSD.push(Number(ethers.parseUnits(v.price, 8)));
    });

    if (!launchpad) return;
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );

    const tx = await launchpadInstance.setTierMaxSupplyPrices(
      tierIds,
      maxSupplies,
      tierPricesUSD
    );
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};

export const setPaymentTokens = async (
  launchpad: string | undefined,
  walletProvider: any,
  selectedCryptocurrencies: string[]
) => {
  try {
    if (!launchpad) return;
    const { paymentTokens, priceFeeds } = buildPaymentAndFeeds(
      selectedCryptocurrencies,
      CRYPTO_CURRENCIES
    );
    const launchpadInstance = await getWriteContract(
      launchpad,
      TicketLaunchpad.abi,
      walletProvider
    );
    const tx = await launchpadInstance.setPaymentTokens(
      paymentTokens,
      priceFeeds
    );
    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};
