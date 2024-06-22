import React, { useMemo, useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';
import data from '../../../../data/sportsData.json';

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

    const { createCampaign }=useAthleteContext();

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