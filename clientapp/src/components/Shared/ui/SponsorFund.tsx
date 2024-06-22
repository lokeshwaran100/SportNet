import React from 'react'
import { DialogModal } from '@/components/custom/DialogModal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { useContractWrite } from '@starknet-react/core'
import { useAthleteContext } from '../../../../context/AthleteContext'

const SponsorFund = ({id}:{id:number}) => {
    const [donatedAmount,setDonatedAmount]=useState(0);
    const SCALE_FACTOR = BigInt(10 ** 18);
    function toBigIntAmount(amount: number) {
        return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
    }
    const donateInput=[
      {
          type:"number",
          name:"Sponsor Amount",
          label:"Sponsor",
          placeholder:"Please enter the amount you want to sponsor",
          value: donatedAmount,
          onChange: (value:number) => setDonatedAmount(value)
      }
    ];
    const { contract }=useAthleteContext();
    const calls = useMemo(() => {
        if (!contract) return [];
        return contract.populateTransaction["sponsor"]!(toBigIntAmount(id),toBigIntAmount(donatedAmount));
      }, [contract,donatedAmount]);
      
    const {
      writeAsync,
      data,
      isPending,
    } = useContractWrite({
      calls,
    });

    const donateAmount=async(amount:number)=>{
      const res=await writeAsync();
      console.log("the sponsoredAmount is", amount);
    }
    
    const onSubmit=()=>{
      donateAmount(donatedAmount);
      console.log("submitted");
    }

    return (
    <>
        <DialogModal
            title={"Sponsor Athlete"}
            description='You will be eligible for betting rewards for the athelete you sponsor'
            inputs={donateInput}
            onSubmit={onSubmit}
            action="Sponsor">
                <Button variant={"black"}>Donate</Button>
        </DialogModal>
    </>
  )
}

export default SponsorFund