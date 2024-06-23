import React, { useMemo, useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';
import data from '../../../../data/sportsData.json';
import {useContractWrite } from '@starknet-react/core';
import { storeCampaignDetails } from '@/lib/Server/AthleteActions';
import { useBlockNumber } from "@starknet-react/core";
import { BlockNumber , num, RpcProvider, hash} from "starknet";
import { hexToDecimal } from '@/lib/utils';

type RaiseFundProps={
    address: string;
}

const RaiseFund = ({address}:RaiseFundProps) => {
    const { sports }=data;
    const sport="Batminton";
    const {athletes}=useAthleteContext();
    const [campaign, setCampaign]=useState({
        title: '',
        description: '',
        amount: 0,
        equipment: '',
    });
    const { data:blockData, isLoading, isError } = useBlockNumber({
        refetchInterval: false,
        blockIdentifier: 'latest' as BlockNumber
    })

    const {contract}=useAthleteContext();

    const SCALE_FACTOR = BigInt(10 ** 18);
    function toBigIntAmount(amount: number) {
        return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
    }

    const calls = useMemo(() => {
    //   console.log("the args are", ...args);
      if (!contract) return [];
      return contract.populateTransaction["create_campaign"]!(toBigIntAmount(campaign.amount));
    }, [contract, campaign.amount]);
    
    const {
      writeAsync,
      data: contractData,
      isPending,
    } = useContractWrite({
      calls,
    });

    const createCampaign = async (campaignData: any) =>{
        try{
          //   setArgs([toBigIntAmount(campaignData.amount)]);
          //   setCallFunction("create_campaign");
          const res=await writeAsync();
          const eventH = num.toHex(hash.starknetKeccak('CreatedCampaign'));
          console.log("event name hash =", eventH); 
          const myKeys = [[eventH]];
          const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
          //   console.log("the block number is", blockData?.block_number)
          const providerRes=await myProvider.getBlockNumber();
          console.log("the latest block from the my provider", providerRes);
          const result = await myProvider.getEvents({
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            from_block: { block_number: providerRes },
            to_block:  { block_number: providerRes },
            keys: myKeys,
            chunk_size: 50,
            continuation_token: undefined,
          });
          console.log("rawEvents=", result.events);
          console.log("the key form the event is",result.events[0].keys[1]);
          const id=hexToDecimal(result.events[0].keys[1]);
          const newCampaignData = {...campaignData, address: address, id: id};
          console.log("Saving campaign data:", newCampaignData);
          await storeCampaignDetails(newCampaignData);
          console.log("Saved campaign data:", newCampaignData);
          console.log("the campaign data is", campaignData); 
          storeCampaignDetails(newCampaignData);
        }
        catch(e){ 
          console.log("error occured", e);
        }
      }

    console.log("entered the Raise Fund");

    const onSubmit=()=>{
        createCampaign(campaign);
    }

    const registerAthleteInput=[
        {
            type:"text",
            name:"title",
            label:"Title",
            placeholder:"Enter a Title",
            value: campaign.title,
            onChange: (value:string) => setCampaign({...campaign, title: value })
        },
        {
            type: "textarea",
            name: "description",
            label: "Description",
            placeholder: "Enter a Description",
            value: campaign.description,
            onChange: (value: string) => setCampaign({ ...campaign, description: value}),
        },
        {
            type: "selection",
            items: sports[sport].equipment,
            name: "equipment",
            label: "Equipment",
            placeholder: "Select the Equipment you wanna fund",
            value: campaign.equipment,
            onChange: (value: string) => setCampaign({ ...campaign, equipment: value })
        },
        {
            type: "number",
            name: "amount",
            label: "Amount",
            placeholder: "Enter the Amount",
            value: campaign.amount,
            onChange: (value: string) => setCampaign({ ...campaign, amount: Number(value) }),
        }
    ];

  return (
    <DialogModal
        title={"Register Athlete"}
        description='U need to get yourself registered as an athlete to create a campaign'
        inputs={registerAthleteInput}
        onSubmit={onSubmit}
        action="Create Campaign"
    >
        <Button>Raise Fund</Button>
    </DialogModal>
  )
}

export default RaiseFund;