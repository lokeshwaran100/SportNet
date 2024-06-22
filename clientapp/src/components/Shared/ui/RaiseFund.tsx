import React, { useMemo, useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';
import data from '../../../../data/sportsData.json';
import { useContractWrite } from '@starknet-react/core';
import { storeCampaignDetails } from '@/lib/Server/AthleteActions';

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
        //   const eventH = num.toHex(hash.starknetKeccak('create_campaign'));
        //   console.log("event name hash =", eventH);
        //   const myKeys = [[eventH]];
        //   const result = await myProvider.getEvents({
        //     address: '0x030d0b10f64347c02dfb01fc509be7cb6dd83eafda366c851c6b56475fe170a8',
        //     from_block: { block_number: 75448 },
        //     to_block:  { block_number: 75448 },
        //     keys: myKeys,
        //     chunk_size: 50,
        //     continuation_token: undefined,
        //   });
        //   console.log("rawEvents=", result.events);
          const newCampaignData = {...campaignData, address: address, id: 0};
          console.log("Saving campaign data:", newCampaignData);
          await storeCampaignDetails(newCampaignData);
          console.log("Saved campaign data:", newCampaignData);
          console.log("the campaign data is", campaignData); 
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