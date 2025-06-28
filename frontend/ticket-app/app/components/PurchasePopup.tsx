"use client";
import React, { HtmlHTMLAttributes, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { Select } from "@/components/ui/select";
import { CRYPTO_CURRENCIES } from "@/constants/constants";
import { Label } from "@radix-ui/react-label";
import { PaymentTokenOption } from "@/types/types";
import {
  getPriceTicket,
  payWithETH,
  payWithToken,
} from "@/lib/web3/smartContract/ticketLaunchpad";
import { ethers } from "ethers";
import {
  allowance,
  approve,
  ethBalanceOf,
} from "@/lib/web3/smartContract/token";
import { checkTokenBalance, getTokenBalance } from "@/lib/web3/utils";
import { buildMintSigParams } from "@/lib/web3/smartContract/buildMintSigParams";

type PurchasePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  ticketInfo: {
    name: string;
    price: string | number;
    eventName?: string;
    paymentTokens?: string[];
    launchpad: string;
  };
  onPurchaseComplete: () => void;
  updateAvailableTicket: (type: string) => void;
  setSelected: (type: null) => void;
};

const getPaymentTokensOptions = (paymentTokens: string[]) => {
  return CRYPTO_CURRENCIES.filter((v) => paymentTokens.includes(v.id));
};

const formatUnits = (
  price: BigInt | number,
  decimals: number,
  symbol: string
) => {
  try {
    return `$${parseFloat(
      ethers.formatUnits(price.toString(), decimals)
    ).toFixed(5)} ${symbol}`;
  } catch (error) {
    console.log(error);
    return `N/A`;
  }
};

export function PurchasePopup({
  isOpen,
  onClose,
  ticketInfo,
  onPurchaseComplete,
  updateAvailableTicket,
  setSelected,
}: PurchasePopupProps) {
  const [purchaseStep, setPurchaseStep] = useState<
    "connect" | "approve" | "confirm" | "processing" | "success" | "fail"
  >("connect");
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [paymentOptions, setPaymentOptions] = useState<PaymentTokenOption[]>(
    []
  );
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState<PaymentTokenOption | null>(null);

  const [priceInPaymentToken, setPriceInPaymentToken] = useState(0);
  const [userBalance, setUserBalance] = useState<bigint | number>(0);
  const [reset, setReset] = useState(0);

  useEffect(() => {
    const options = getPaymentTokensOptions(ticketInfo.paymentTokens || []);
    setPaymentOptions(options);
    setSelectedPaymentOption(options[0] || null);

    (async () => {
      const price = await getPriceTicket(
        ticketInfo.launchpad,
        ticketInfo.name,
        options[0]?.address || ""
      );

      setPriceInPaymentToken(price);
    })();
  }, [reset]);

  useEffect(() => {
    if (isConnected) {
      // the default selectedOption is always ETH, meaning no approve is required
      setPurchaseStep("confirm");
      (async () => {
        const ethBalance = await ethBalanceOf(address);
        setUserBalance(ethBalance || 0);
      })();
    } else setPurchaseStep("connect");
  }, [isConnected, reset]);

  if (!isOpen) return null;

  const changePaymentOption = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedId = e.target.value;
    const selectedOption =
      paymentOptions.find((opt) => opt.id === selectedId) || null;
    setSelectedPaymentOption(selectedOption);

    const price = await getPriceTicket(
      ticketInfo.launchpad,
      ticketInfo.name,
      selectedOption?.address || ""
    );
    setPriceInPaymentToken(price);
    const tokenBalance = await getTokenBalance(
      address,
      selectedOption?.id,
      selectedOption?.address
    );
    setUserBalance(tokenBalance);
    // if selected payment token is ERC20
    if (selectedOption?.id !== "ETH") {
      // Check approve allowance
      const totalAllowance = await allowance(
        selectedOption?.address || null,
        address || null,
        ticketInfo.launchpad
      );

      // if totalAllowance is less than price, approve is required
      if (price > totalAllowance) setPurchaseStep("approve");
    } else {
      setPurchaseStep("confirm");
    }
  };

  const handleConnectWallet = () => {
    // Connect wallet
    open();
    // the default selectedOption is always ETH, meaning no approve is required
    setPurchaseStep("confirm");
  };

  const handleApproveToken = async () => {
    try {
      setPurchaseStep("processing");
      await approve(
        selectedPaymentOption?.address || null,
        ticketInfo.launchpad,
        priceInPaymentToken,
        walletProvider
      );
      setPurchaseStep("confirm");
    } catch (error) {
      setPurchaseStep("approve");
    }
  };

  const handleConfirmPurchase = async () => {
    try {
      setPurchaseStep("processing");
      // Check token balance
      const result = await checkTokenBalance(
        address,
        selectedPaymentOption?.id,
        selectedPaymentOption?.address,
        priceInPaymentToken
      );
      if (!result) throw new Error("Could not check token balance");

      //Build single params
      const params = await buildMintSigParams(
        ticketInfo.launchpad,
        address || undefined,
        "", // currently no seat section
        "", // currently no seat number
        ticketInfo.name
      );

      // Purchase

      if (!params) throw new Error("Could not fetch signature");

      // Currently only mint a single NFT, no batch
      if (selectedPaymentOption?.id === "ETH") {
        await payWithETH(walletProvider, params, priceInPaymentToken);
      } else {
        await payWithToken(
          walletProvider,
          selectedPaymentOption?.address,
          params
        );
      }

      // update available ticket
      await updateAvailableTicket(ticketInfo.name);
      // update balance
      const tokenBalance = await getTokenBalance(
        address,
        selectedPaymentOption?.id,
        selectedPaymentOption?.address
      );
      setUserBalance(tokenBalance);
      setPurchaseStep("success");
    } catch (error) {
      setPurchaseStep("fail");
    }
  };

  const handleClose = () => {
    setSelected(null);
    setReset(new Date().getTime());
    if (purchaseStep === "success") {
      onPurchaseComplete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl w-full max-w-md p-6 animate-slide-up shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Purchase Ticket</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-500">Ticket Type</p>
            <p className="font-medium">{ticketInfo.name}</p>

            {ticketInfo.eventName && (
              <>
                <p className="text-sm text-gray-500 mt-2">Event</p>
                <p className="font-medium">{ticketInfo.eventName}</p>
              </>
            )}

            <Label
              htmlFor="paymentOption"
              className="text-sm text-gray-500 mt-2"
            >
              Payment Option
            </Label>
            <Select
              id="paymentOption"
              value={selectedPaymentOption?.id || ""}
              onChange={changePaymentOption}
            >
              {getPaymentTokensOptions(ticketInfo.paymentTokens || []).map(
                (opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                )
              )}
            </Select>
            {selectedPaymentOption && (
              <>
                <p className="text-sm text-gray-500 mt-2">Price</p>
                <p className="font-bold text-blue-600">
                  {`${ticketInfo.price} ≈ ${formatUnits(
                    priceInPaymentToken,
                    selectedPaymentOption.decimals,
                    selectedPaymentOption.id
                  )}`}
                </p>
              </>
            )}

            {isConnected && selectedPaymentOption && (
              <>
                <p className="text-sm text-gray-500 mt-2">Balance</p>
                <p className="font-bold text-blue-600">
                  {formatUnits(
                    userBalance,
                    selectedPaymentOption.decimals,
                    selectedPaymentOption.id
                  )}
                </p>
              </>
            )}
          </div>

          {purchaseStep === "connect" && (
            <div className="text-center">
              <p className="mb-4">
                Connect your crypto wallet to purchase this ticket
              </p>
              <Button onClick={handleConnectWallet} className="w-full">
                Connect Wallet
              </Button>
            </div>
          )}

          {purchaseStep === "approve" && (
            <div className="text-center">
              <p className="mb-4">Approve your token?</p>
              <Button onClick={handleApproveToken} className="w-full">
                Approve
              </Button>
            </div>
          )}

          {purchaseStep === "confirm" && (
            <div className="text-center">
              <p className="mb-4">
                Your wallet is connected. Confirm your purchase?
              </p>
              <Button onClick={handleConfirmPurchase} className="w-full">
                Confirm Purchase
              </Button>
            </div>
          )}

          {purchaseStep === "processing" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p>Processing your transaction...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please wait, your transaction is being submitted
              </p>
            </div>
          )}

          {purchaseStep === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4 text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600 mb-2">
                Purchase Successful!
              </p>
              <p className="mb-4">Your ticket has been added to your wallet</p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}

          {purchaseStep === "fail" && (
            <div className="text-center">
              <div className="flex justify-center mb-4 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-red-600 mb-2">
                Something went wrong
              </p>
              <p className="mb-4">Please try it again</p>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
