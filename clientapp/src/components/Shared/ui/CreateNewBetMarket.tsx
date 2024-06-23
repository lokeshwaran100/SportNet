import React, { useMemo, useState } from 'react'
import { DialogModal } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { useAthleteContext } from '../../../../context/AthleteContext';
import { useContractWrite } from '@starknet-react/core';
import { storeCampaignDetails } from '@/lib/Server/AthleteActions';
import { storeNewBettingDetails } from '@/lib/Server/OwnerActions';
import { RpcProvider, cairo } from 'starknet';
import { useOwnerContext } from '../../../../context/OwnerContext';


const RaiseFund = () => {
  const { bettingContract } = useOwnerContext();
  const { athletes } = useAthleteContext();
  const [market, setMarket] = useState({
    name: '',
    description: '',
    athlete: '',
    options: ["Win", "Lose"],
    min_bet: 0,
  });
  const [athleteAddress, setAthleteAddress] = useState<null | string>(null);

  const SCALE_FACTOR = BigInt(10 ** 18);
  function toBigIntAmount(amount: number) {
    return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
  }

  const calls = useMemo(() => {
    if (!bettingContract || !market) return [];
    return bettingContract.populateTransaction["create_market"]!(
      cairo.isTypeContractAddress(market.athlete),
      toBigIntAmount(market.min_bet));
  }, [bettingContract, market]);

  const {
    writeAsync,
    data,
    isPending,
  } = useContractWrite({
    calls,
  });

  const createMarket = async (marketData: any) => {

    athletes.forEach((athlete) => {
      console.log(athlete.name, market.athlete)
      if (athlete.name === market.athlete) {
        console.log(athlete.address)
        setAthleteAddress(athlete.address)
      }
    })

    setTimeout(() => { }, 1000);

    try {
      const res = await writeAsync();
      console.log("Transaction Hash: ", res.transaction_hash);

      const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
      let wait_for = await myProvider.waitForTransaction(res.transaction_hash);

      const newBetting = { ...marketData, id: 0 };
      await storeNewBettingDetails(newBetting);
    }
    catch (e) {
      console.log("error occured", e);
    }
  }

  const onSubmit = () => {
    createMarket(market);

  }

  const createBetMarketInputs = [
    {
      type: "text",
      name: "name",
      label: "Name",
      placeholder: "Enter New Bet Name",
      value: market.name,
      onChange: (value: string) => setMarket({ ...market, name: value })
    },
    {
      type: "textarea",
      name: "description",
      label: "Description",
      placeholder: "Enter Bet Market Description",
      value: market.description,
      onChange: (value: string) => setMarket({ ...market, description: value }),
    },
    {
      type: "selection",
      items: athletes.flatMap(athlete => [athlete.name]),
      name: "athlete",
      label: "Athlete",
      placeholder: "Select the Athlete",
      value: market.athlete,
      onChange: (value: string) => setMarket({ ...market, athlete: value })
    },
    {
      type: "number",
      name: "amount",
      label: "Min Bet",
      placeholder: "Enter the minimum bet Amount",
      value: market.min_bet,
      onChange: (value: string) => setMarket({ ...market, min_bet: Number(value) }),
    }
  ];

  return (
    <DialogModal
      title={"Bet Market Creation"}
      description='Creates a bet market for placing bet on Athlete result of win or loss'
      inputs={createBetMarketInputs}
      onSubmit={onSubmit}
      action="Create New Bet Market">
      <Button>Create New Bet Market</Button>
    </DialogModal>
  )
}

export default RaiseFund;