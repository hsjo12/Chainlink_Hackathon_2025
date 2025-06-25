require("dotenv").config();

import axios, { AxiosResponse } from "axios";
import TicketLaunchpad from "@/smartContracts/abis/TicketLaunchpad.json";
import { getReadOnlyContract } from "../provider";
import { STANDARD, STANDING, VIP } from "@/constants/constants";
import { Seat } from "@/types/types";
import { buildTierValue } from "../utils";

function buildTierValueList(seatTypes: string[]): number[] {
  return seatTypes.map((v) => buildTierValue(v));
}
function buildSeats(
  seatSections: string[],
  seatNumbers: string[],
  seatTypes: number[]
): Seat[] {
  return seatSections.map((v, i) => [v, seatNumbers[i], seatTypes[i]]);
}
interface DefenderResponse {
  result: string; // JSON.stringified → { statusCode, body: "{ \"signature\": \"0x...\" }" }
}

export const buildMintSigParams = async (
  launchpad: string,
  to: string | undefined,
  seatSection: string,
  seatNumber: string,
  seatType: string
) => {
  try {
    if (!to) return;

    const _seatType = buildTierValue(seatType);
    const seat: Seat = [seatSection, seatNumber, _seatType];
    const launchPad = await getReadOnlyContract(launchpad, TicketLaunchpad.abi);
    const rawNonce = await launchPad.nonces(to);
    const nonce = Number(rawNonce);

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const tenMinutesLater = nowInSeconds + 600;

    const response: AxiosResponse<DefenderResponse> = await axios.post(
      process.env.NEXT_PUBLIC_SIGNATURE_WEBHOOK || "",
      {
        mode: "single",
        launchpad,
        to,
        seat,
        nonce,
        deadline: tenMinutesLater,
      }
    );

    if (!response.data?.result) {
      throw new Error("Signature webhook did not return a result field");
    }

    const parsed = JSON.parse(response.data.result);
    if (!parsed.body) {
      throw new Error("Signature webhook result missing body field");
    }

    const payload = JSON.parse(parsed.body);
    if (!payload.signature) {
      throw new Error("Signature webhook payload missing signature");
    }

    const signature = payload.signature;
    return {
      launchpad,
      to,
      seat,
      nonce: Number(nonce),
      deadline: tenMinutesLater, //deadline
      signature,
    };
  } catch (error) {
    console.log(error);
  }
};

export const buildBatchMintSigParams = async (
  launchpad: string,
  to: string | undefined,
  seatSections: string[],
  seatNumbers: string[],
  seatTypes: string[]
) => {
  try {
    if (!to) return;

    const _seatTypes = buildTierValueList(seatTypes);
    const seats: Seat[] = buildSeats(seatSections, seatNumbers, _seatTypes);

    const launchPad = await getReadOnlyContract(launchpad, TicketLaunchpad.abi);
    const rawNonce = await launchPad.nonces(to);
    const nonce = Number(rawNonce);

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const tenMinutesLater = nowInSeconds + 600;

    const response: AxiosResponse<DefenderResponse> = await axios.post(
      process.env.NEXT_PUBLIC_SIGNATURE_WEBHOOK || "",
      {
        mode: "batch",
        launchpad,
        to,
        seats,
        nonce,
        deadline: tenMinutesLater,
      }
    );

    if (!response.data?.result) {
      throw new Error("Signature webhook did not return a result field");
    }

    const parsed = JSON.parse(response.data.result);
    if (!parsed.body) {
      throw new Error("Signature webhook result missing body field");
    }

    const payload = JSON.parse(parsed.body);
    if (!payload.signature) {
      throw new Error("Signature webhook payload missing signature");
    }

    const signature = payload.signature;
    return {
      launchpad,
      to,
      seats,
      nonce: Number(nonce),
      deadline: tenMinutesLater, //deadline
      signature,
    };
  } catch (error) {
    console.log(error);
  }
};
