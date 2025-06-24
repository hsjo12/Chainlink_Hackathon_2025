"use client";
import "react-toastify/dist/ReactToastify.css";
import { toast, Id } from "react-toastify";
import { TransactionResponse, TransactionReceipt } from "ethers";

let isToastVisible = false;
const toastVisibility = new Set<string>();

type ToastType = "success" | "error" | "info" | "warn" | "dismiss";

/**
 * Display a toast message with given options
 */
export function toastMessage(
  message: string,
  type: ToastType,
  time = 2000
): Id | undefined {
  const options = {
    position: "top-center" as const,
    autoClose: time,
    onClose: () => {
      isToastVisible = false;
      toastVisibility.delete(`${type}-${message}`);
    },
  };

  const toastKey = `${type}-${message}`;

  if (type !== "dismiss" && toastVisibility.has(toastKey)) return;
  toastVisibility.add(toastKey);

  isToastVisible = true;

  switch (type) {
    case "success":
      return toast.success(message, options);
    case "error":
      toastVisibility.clear();
      toast.dismiss();
      return toast.error(message, options);
    case "info":
      return toast.info(message, options);
    case "warn":
      return toast.warn(message, options);
    case "dismiss":
      isToastVisible = false;
      toast.dismiss();
      return;
    default:
      toastVisibility.clear();
      return toast(message, options);
  }
}

/**
 * Toast for wallet connect
 */
export const connectMessage = async (): Promise<Id | undefined> => {
  return toastMessage("Please Connect Your Wallet", "warn");
};

/**
 * Toast for transaction execution
 */
export const txMessage = async (
  tx: TransactionResponse,
  message = "Transaction is sending..."
): Promise<void> => {
  const toastId = toastMessage(message, "info", 600000);

  try {
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt) {
      if (toastId !== undefined) toast.dismiss(toastId);
      toastMessage("Transaction failed: no receipt", "error");
      return;
    }

    if (toastId !== undefined) toast.dismiss(toastId);
    toastVisibility.delete(`info-${message}`);
    isToastVisible = false;

    if (receipt.status === 1) {
      setTimeout(() => toastMessage("Transaction is successful", "success"), 0);
    } else {
      setTimeout(() => toastMessage("Transaction is failed", "error"), 0);
    }
  } catch (error) {
    console.error("txMessage error:", error);
    if (toastId !== undefined) toast.dismiss(toastId);
    toastVisibility.delete(`info-${message}`);
    isToastVisible = false;
    toastMessage("Transaction Error", "error");
  }
};

/**
 * Toast for approve transaction
 */
export const txApprove = async (tx: TransactionResponse): Promise<void> => {
  const toastId = toastMessage("Approving...", "info", 600000);

  try {
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt) {
      if (toastId !== undefined) toast.dismiss(toastId);
      toastMessage("Approval failed: no receipt", "error");
      return;
    }

    if (toastId !== undefined) toast.dismiss(toastId);
    toastVisibility.delete("info-Approving...");
    isToastVisible = false;

    if (receipt.status === 1) {
      setTimeout(() => toastMessage("Approval successful", "success"), 0);
    } else {
      setTimeout(() => toastMessage("Approval failed", "error"), 0);
    }
  } catch (error) {
    console.error("txApprove error:", error);
    if (toastId !== undefined) toast.dismiss(toastId);
    toastVisibility.delete("info-Approving...");
    isToastVisible = false;
    toastMessage("Approval Error", "error");
  }
};
