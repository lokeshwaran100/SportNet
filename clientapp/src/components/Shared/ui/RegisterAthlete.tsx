import React, { useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';

const RegisterAthlete = () => {
    const [athlete, setAthelete]=useState({
        name:'',
        sport: '',
    });

    const { register }=useAthleteContext();

    const onSubmit=()=>{
        register(athlete);
    }

    const registerAthleteInput=[
        {
            type:"text",
            name:"name",
            label:"Name",
            placeholder:"Enter your Name",
            value:athlete.name,
            onChange:(value:string)=>setAthelete({...athlete,name:value})
        },
        {
            type: "selection",
            items: ["Batminton","Football"],
            name: "sport",
            label: "Sport",
            placeholder: "Select your Sport",
            value: athlete.sport,
            onChange: (value: string) => setAthelete({ ...athlete, sport: value }),
        }
    ]
  return (
    <DialogModal
        title={"Register Athlete"}
        description='U need to get yourself registered as an ethlete to create a campaign'
        inputs={registerAthleteInput}
        onSubmit={onSubmit}
        action="Register"
    >
        <Button>Register as Athlete</Button>
    </DialogModal>
  )
}

export default RegisterAthlete