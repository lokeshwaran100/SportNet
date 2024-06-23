import React from 'react'
import { DialogModal } from '@/components/custom/DialogModal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { useContractWrite } from '@starknet-react/core'
import { useAthleteContext } from '../../../../context/AthleteContext'
import { storeDonatedAmount } from '@/lib/Server/UserAction'
import { useAccount } from '@starknet-react/core'
import { cairo } from 'starknet'

const SponsorFund = ({id}:{id:number}) => {
    const { address } = useAccount();
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
        return contract.populateTransaction["sponsor"]!(id,toBigIntAmount(donatedAmount));
      }, [contract, donatedAmount]);
      
    const {
      writeAsync,
      data,
      isPending,
    } = useContractWrite({
      calls,
    });

    const stkCalls = useMemo(() => {
      const tx = {
        contractAddress: '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D',
        entrypoint: 'approve',
        calldata: [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, cairo.uint256(donatedAmount)]
      };
      return Array(1).fill(tx);
    }, [address, donatedAmount]);

    const { write } = useContractWrite({ calls: stkCalls });

    const donateAmount=async(amount:number)=>{
      try{
        const apporveRes=await write();
        const res=await writeAsync();
        storeDonatedAmount(id, amount);
        console.log("the sponsoredAmount is", amount);
      }
      catch(err){
        console.log("error in donating amount", err);
      }
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