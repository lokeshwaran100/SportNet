import React, { useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';
import { useMemo } from 'react';
import { useContractWrite } from '@starknet-react/core';
import { createAthlete } from '@/lib/Server/AthleteActions';

const RegisterAthlete = ({address}:{address:string}) => {
    const [athlete, setAthelete]=useState({
        name:'',
        sport: '',
    });

    console.log("entered register athlete");
    const { contract }=useAthleteContext();
    const calls = useMemo(() => {
        if (!contract) return [];
        return contract.populateTransaction["athlete_register"]!();
      }, [contract]);
      
      const {
        writeAsync,
        data,
        isPending,
      } = useContractWrite({
        calls,
      });
    
  const register=async(registeredData: any)=>{
    try{
      const res=await writeAsync();
      console.log(res);
      console.log("the registered data is", registeredData);
      const newRegisteredData = {...registeredData, address: address};
      createAthlete(newRegisteredData);
    }
    catch(e){
      console.log("error occured", e);
    }
  }

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