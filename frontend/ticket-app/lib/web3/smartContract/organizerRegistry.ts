import { ethers } from "ethers";
import { getReadOnlyContract } from "../provider";
import OrganizerRegistry from "@/smartContracts/abis/OrganizerRegistry.json";
export const checkOrganizer = async (address: string | undefined) => {
  try {
    if (!ethers.isAddress(address) || !address) return false;

    const organizerRegistry = await getReadOnlyContract(
      OrganizerRegistry.address,
      OrganizerRegistry.abi
    );

    return await organizerRegistry.checkOrganizer(address);
  } catch (error) {
    console.log(error);
  }
};
