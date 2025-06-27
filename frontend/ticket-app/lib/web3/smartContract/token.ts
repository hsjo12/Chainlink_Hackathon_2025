import { txApprove } from "@/lib/react-tostify/popup";
import {
  getProvider,
  getReadOnlyContract,
  getWriteContract,
} from "../provider";

export const ethBalanceOf = async (owner: string | null | undefined) => {
  try {
    if (!owner) return 0;
    return await getProvider().getBalance(owner);
  } catch (error) {
    console.log(error);
  }
};

export const balanceOf = async (
  paymentToken: string | null | undefined,
  owner: string | null | undefined
) => {
  try {
    if (!paymentToken || !owner) return 0;

    const token = await getReadOnlyContract(paymentToken, [
      "function balanceOf(address owner) external view returns (uint256)",
    ]);

    return await token.balanceOf(owner);
  } catch (error) {
    console.log(error);
  }
};

export const allowance = async (
  paymentToken: string | null | undefined,
  owner: string | null | undefined,
  spender: string
) => {
  try {
    if (!paymentToken || !owner) return 0;

    const token = await getReadOnlyContract(paymentToken, [
      "function allowance(address owner, address spender) external view returns (uint256)",
    ]);

    return await token.allowance(owner, spender);
  } catch (error) {
    console.log(error);
  }
};

export const approve = async (
  paymentToken: string | null,
  spender: string,
  amount: number,
  walletProvider: any
) => {
  try {
    if (!paymentToken) return;
    const token = await getWriteContract(
      paymentToken,
      [
        "function approve(address spender, uint256 value) external returns (bool)",
      ],
      walletProvider
    );
    const tx = await token.approve(spender, amount);

    // Show Pop up message
    await txApprove(tx);
  } catch (error) {
    console.log(error);
  }
};
