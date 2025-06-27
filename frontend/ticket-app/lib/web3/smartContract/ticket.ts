import { EventDetails } from "@/types/types";
import { getWriteContract } from "../provider";
import Ticket from "@/smartContracts/abis/Ticket.json";
import { txMessage } from "@/lib/react-tostify/popup";

export const setEventDetails = async (
  ticketAddress: string,
  walletProvider: any,
  params: EventDetails
) => {
  try {
    const ticket = await getWriteContract(
      ticketAddress,
      Ticket.abi,
      walletProvider
    );

    const tx = await ticket.setEventDetails(params);

    // Show Pop up message
    await txMessage(tx);
  } catch (error) {
    console.log(error);
  }
};
