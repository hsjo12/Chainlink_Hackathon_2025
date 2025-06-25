import TicketLaunchpad from "@/smartContracts/abis/TicketLaunchpad.json";
import { getReadOnlyContract, getWriteContract } from "../provider";
import { STANDARD, STANDING, VIP } from "@/constants/constants";
import { ethers } from "ethers";
import { MintBatchSignatureParams, MintSignatureParams } from "@/types/params";

export const getPriceTicket = async (
  launchpad: string,
  tier: string,
  paymentToken: string
) => {
  if (!ethers.isAddress(launchpad) || !ethers.isAddress(paymentToken)) return 0;

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
    await tx.wait();
  } catch (error) {
    console.log(error);
  }
};

export const payWithToken = async (
  walletProvider: any,
  paymentToken: string | undefined,
  params: MintSignatureParams
) => {
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
  await tx.wait();
};

export const payBatchWithETH = async (
  walletProvider: any,
  params: MintBatchSignatureParams,
  price: number
) => {
  const { launchpad, to, seats, nonce, deadline, signature } = params;
  const launchpadInstance = await getWriteContract(
    launchpad,
    TicketLaunchpad.abi,
    walletProvider
  );

  await launchpadInstance.payBatchWithETH(
    [launchpad, to, seats, nonce, deadline, signature],
    { value: price }
  );
};

export const payBatchWithToken = async (
  walletProvider: any,
  paymentToken: string | undefined,
  params: MintBatchSignatureParams
) => {
  if (!paymentToken) throw new Error("Invalid payment token");
  const { launchpad, to, seats, nonce, deadline, signature } = params;
  const launchpadInstance = await getWriteContract(
    launchpad,
    TicketLaunchpad.abi,
    walletProvider
  );

  await launchpadInstance.payBatchWithToken(paymentToken, [
    launchpad,
    to,
    seats,
    nonce,
    deadline,
    signature,
  ]);
};

export const availableTicket = async (
  launchpad: string | undefined,
  tier: number
) => {
  if (!launchpad) return [];
  const launchpadInstance = await getReadOnlyContract(
    launchpad,
    TicketLaunchpad.abi
  );

  const [priceUSD, maxSupply, sold, hasSeatNumbers] =
    await launchpadInstance.tierInfo(tier);

  console.log(maxSupply - sold);
  return maxSupply - sold;
};
