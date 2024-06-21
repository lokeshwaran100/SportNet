import React, { useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';

const RaiseFund = () => {
    const [campaign, setCampaign]=useState({
        name:'',
        sport: '',
    });

    const { createCampaign }=useAthleteContext();

    const onSubmit=()=>{
        createCampaign(campaign);
    }

    const registerAthleteInput=[
        {
            type:"text",
            name:"name",
            label:"Name",
            placeholder:"Enter your Name",
            value:campaign.name,
            onChange: (value:string) => setCampaign({...campaign, name: value })
        },
        {
            type: "selection",
            items: ["Batminton","Football"],
            name: "sport",
            label: "Sport",
            placeholder: "Select your Sport",
            value: campaign.sport,
            onChange: (value: string) => setCampaign({ ...campaign, sport: value })
        }
    ]
  return (
    <DialogModal
        title={"Register Athlete"}
        description='U need to get yourself registered as an ethlete to create a campaign'
        inputs={registerAthleteInput}
        onSubmit={onSubmit}>
        <Button>Raise Fund</Button>
    </DialogModal>
  )
}

export default RaiseFund;