import { CreatePairParams } from "@/types/params";
import { getWriteContract } from "../provider";
import TicketFactory from "@/smartContracts/abis/TicketFactory.json";
import { Interface } from "ethers";

export const createTicketPair = async (
  walletProvider: any,
  params: CreatePairParams
) => {
  const {
    ethUsdPriceFeed,
    eventDetails,
    tierIds,
    imageURIs,
    tierInfoList,
    paymentTokens,
    priceFeeds,
  } = params;
  const iface = new Interface([
    "event Created(address indexed user, address indexed ticket, address indexed ticketLaunchpad)",
  ]);
  const ticketFactory = await getWriteContract(
    TicketFactory.address,
    TicketFactory.abi,
    walletProvider
  );

  try {
    const tx = await ticketFactory.createTicketPair(
      ethUsdPriceFeed,
      eventDetails,
      tierIds,
      imageURIs,
      tierInfoList,
      paymentTokens,
      priceFeeds
    );
    const receipt = await tx.wait();
    const log = receipt.logs[receipt.logs.length - 1];
    const parsed = iface.parseLog({
      data: log.data,
      topics: log.topics,
    });
    const [user, ticket, ticketLaunchpad] = parsed?.args as string[];

    return { ticket, ticketLaunchpad, market: ticketLaunchpad };
  } catch (error) {
    console.log(error);
    return undefined;
  }
};
