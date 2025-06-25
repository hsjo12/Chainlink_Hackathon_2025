import { STANDARD, STANDING, VIP } from "@/constants/constants";
import { connectMessage, toastMessage } from "../react-tostify/popup";
import { balanceOf, ethBalanceOf } from "./smartContract/token";

export const checkConnection = (isConnected: boolean) => {
  if (!isConnected) return connectMessage();
};

export const checkTokenBalance = async (
  owner: string | undefined,
  paymentTokenName: string | undefined,
  paymentTokenAddress: string | undefined,
  price: number
) => {
  if (owner == null || paymentTokenName == null || paymentTokenAddress == null)
    return false;
  let balance;
  if (paymentTokenName === "ETH") {
    balance = await ethBalanceOf(owner);
  } else {
    balance = await balanceOf(paymentTokenAddress, owner);
  }

  if (price > balance) {
    toastMessage("Insufficient payment token", "warn");
    return false;
  }

  return true;
};

export const getTokenBalance = async (
  owner: string | undefined,
  paymentTokenName: string | undefined,
  paymentTokenAddress: string | undefined
) => {
  if (owner == null || paymentTokenName == null || paymentTokenAddress == null)
    return 0;
  let balance;
  if (paymentTokenName === "ETH") {
    return await ethBalanceOf(owner);
  } else {
    return await balanceOf(paymentTokenAddress, owner);
  }
};

export function buildTierValue(seatType: string): number {
  if (seatType.toLowerCase() === "vip") return VIP;
  else if (seatType.toLowerCase() === "standard") return STANDARD;
  else return STANDING;
}
