import { type ClassValue, clsx } from "clsx"
import { num, hash, RpcProvider, events } from "starknet";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToDecimal(hex:string) {
  return parseInt(hex, 16);
}

export async function extractEventData(eventName: string)
{
  const eventH = num.toHex(hash.starknetKeccak(eventName));
  console.log("event name hash =", eventH); 
  const myKeys = [[eventH]];
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
  //   console.log("the block number is", blockData?.block_number)
  const providerRes=await myProvider.getBlockNumber();
  console.log(providerRes);
  const result = await myProvider.getEvents({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    from_block: { block_number: providerRes },
    to_block:  { block_number: providerRes },
    keys: myKeys,
    chunk_size: 50,
    continuation_token: undefined,
  });
  console.log("the result is", result);
  return ({keys:result.events[result.events.length-1].keys,data:result.events[0].data});
}


