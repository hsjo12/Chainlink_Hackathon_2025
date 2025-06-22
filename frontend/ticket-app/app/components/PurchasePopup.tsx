'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

type PurchasePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  ticketInfo: {
    type: string;
    price: string | number;
    eventName?: string;
    currency?: string;
  };
  onPurchaseComplete: () => void;
};

export function PurchasePopup({ isOpen, onClose, ticketInfo, onPurchaseComplete }: PurchasePopupProps) {
  const [purchaseStep, setPurchaseStep] = useState<'connect' | 'confirm' | 'processing' | 'success'>('connect');
  const [walletConnected, setWalletConnected] = useState(false);

  if (!isOpen) return null;

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setTimeout(() => {
      setWalletConnected(true);
      setPurchaseStep('confirm');
    }, 1000);
  };

  const handleConfirmPurchase = () => {
    setPurchaseStep('processing');

    // Simulate blockchain transaction
    setTimeout(() => {
      setPurchaseStep('success');
    }, 2000);
  };

  const handleClose = () => {
    if (purchaseStep === 'success') {
      onPurchaseComplete();
    }
    onClose();
    // Reset state for next time
    setPurchaseStep('connect');
    setWalletConnected(false);
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
            <p className="font-medium">{ticketInfo.type}</p>

            {ticketInfo.eventName && (
              <>
                <p className="text-sm text-gray-500 mt-2">Event</p>
                <p className="font-medium">{ticketInfo.eventName}</p>
              </>
            )}

            <p className="text-sm text-gray-500 mt-2">Price</p>
            <p className="font-bold text-blue-600">
              {typeof ticketInfo.price === 'number' 
                ? `${ticketInfo.currency || '$'}${ticketInfo.price}` 
                : ticketInfo.price}
            </p>
          </div>

          {purchaseStep === 'connect' && (
            <div className="text-center">
              <p className="mb-4">Connect your crypto wallet to purchase this ticket</p>
              <Button 
                onClick={handleConnectWallet} 
                className="w-full"
              >
                Connect Wallet
              </Button>
            </div>
          )}

          {purchaseStep === 'confirm' && (
            <div className="text-center">
              <p className="mb-4">Your wallet is connected. Confirm your purchase?</p>
              <Button 
                onClick={handleConfirmPurchase} 
                className="w-full"
              >
                Confirm Purchase
              </Button>
            </div>
          )}

          {purchaseStep === 'processing' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p>Processing your transaction...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your purchase on the blockchain</p>
            </div>
          )}

          {purchaseStep === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600 mb-2">Purchase Successful!</p>
              <p className="mb-4">Your ticket has been added to your wallet</p>
              <Button 
                onClick={handleClose} 
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
