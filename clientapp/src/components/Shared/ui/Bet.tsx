import React from 'react'
import { DialogModal } from '@/components/custom/DialogModal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { useContractWrite } from '@starknet-react/core'
import { useOwnerContext } from '../../../../context/OwnerContext'
import { storeDonatedAmount } from '@/lib/Server/UserAction'
import { useAccount } from '@starknet-react/core'
import { cairo } from 'starknet'
import { storeParticipantDetails } from '@/lib/Server/UserAction'

const Bet = ({ id }: { id: number }) => {
  const { address } = useAccount();
  const [betAmount, setBetAmount] = useState(0);
  const [betOption, setBetOption] = useState(0);
  const SCALE_FACTOR = BigInt(10 ** 18);
  function toBigIntAmount(amount: number) {
    return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
  }
  const betOptions = ["Win", "Lose"];
  const betInput = [
    {
      type: "number",
      name: "Bet Amount",
      label: "Bet Amount",
      placeholder: "Please enter the amount you want to bet",
      value: betAmount,
      onChange: (value: number) => setBetAmount(value)
    },
    {
      type: "selection",
      items: betOptions,
      name: "Bet Option",
      label: "Choice",
      placeholder: "Choose the Bet Result",
      value: betOption,
      onChange: (value: string) => setBetOption(betOptions.indexOf(value))
    }
  ];
  const { bettingContract } = useOwnerContext();

  const betOnMarketCalls = useMemo(() => {
    if (!bettingContract) return [];
    return bettingContract.populateTransaction["betOnMarket"]!(id, betOption, toBigIntAmount(betAmount));
  }, [bettingContract, betOption, betAmount]);

  const { writeAsync: SC_betOnMarket } = useContractWrite({ calls: betOnMarketCalls });

  // const stkCalls = useMemo(() => {
  //   const tx = {
  //     contractAddress: process.env.NEXT_PUBLIC_ERC20_CONTRACT_ADDRESS,
  //     entrypoint: 'approve',
  //     calldata: [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, cairo.uint256(betAmount)]
  //   };
  //   return Array(1).fill(tx);
  // }, [address, betAmount]);

  // const { write: SC_approve } = useContractWrite({ calls: stkCalls });

  const bettingAmount = async (amount: number) => {
    try {
      // let result = await SC_approve();
      // const res = await SC_betOnMarket();
      console.log(":the betting details are", id, address, betAmount, betOption);
      storeParticipantDetails(id,address,betAmount,betOption);
      console.log("Bet amount is", amount);
    }
    catch (err) {
      console.log("error in donating amount", err);
    }
  }

  const onSubmit = () => {
    bettingAmount(betAmount);
    console.log("submitted");
  }

  return (
    <>
      <DialogModal
        title={"Place the Bet"}
        description='Place the bet on athlethe whether win or lose'
        inputs={betInput}
        onSubmit={onSubmit}
        action="bet">
        <Button variant={"black"}>Bet</Button>
      </DialogModal>
    </>
  )
}

export default Bet