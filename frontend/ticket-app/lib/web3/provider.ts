require("dotenv").config();

import {
  ethers,
  Contract,
  InterfaceAbi,
  Eip1193Provider,
  BrowserProvider,
} from "ethers";

export const getProvider = () => {
  const rpc = process.env.NEXT_PUBLIC_RPC;
  return new ethers.JsonRpcProvider(rpc);
};

export const getReadOnlyContract = (target: string, abi: InterfaceAbi) => {
  const rpc = process.env.NEXT_PUBLIC_RPC;
  console.log(rpc);
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Contract(target, abi, provider);
};

export const getWriteContract = async (
  target: string,
  abi: InterfaceAbi,
  walletProvider: any
) => {
  const ethersProvider = new BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  return new Contract(target, abi, signer);
};
