"use client"
import React, { useMemo } from 'react'
// pages/user-dashboard.js

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { useUserContext } from '../../../context/UserContext';
import { useAccount, useContractWrite } from '@starknet-react/core';
import { useOwnerContext } from '../../../context/OwnerContext';
import { RpcProvider } from 'starknet';


const bettingsData = [
  // Sample data
  { id: 1, match: 'Match 1', amount: 50, status: 'Won', date: '2024-06-01' },
  { id: 2, match: 'Match 2', amount: 100, status: 'Lost', date: '2024-06-02' },
  { id: 3, match: 'Match 3', amount: 75, status: 'Won', date: '2024-06-03' },
  { id: 4, match: 'Match 4', amount: 200, status: 'Lost', date: '2024-06-04' },
  { id: 5, match: 'Match 5', amount: 60, status: 'Won', date: '2024-06-05' },
];

const Stat = ({ label, value }: { label: any, value: any }) => (
  <div className="bg-white p-4 rounded shadow">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl text-black font-bold">{value}</div>
  </div>
);

const Page = () => {
  const [totalBettingsDone, setTotalBettingsDone] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLoses, setTotalLoses] = useState(0);
  const [totalRewardsEarned, setTotalRewardsEarned] = useState(0);
  const [bettingData, setBettingData] = useState(new Array<any>());
  const [claimId, setClaimId] = useState<null | Number>(null);

  const { address } = useAccount();
  const { participants } = useUserContext();
  const { bettings, bettingContract } = useOwnerContext();

  useEffect(() => {
    // Fetch data from API or state and calculate the totals
    const wins = bettingsData.filter(betting => betting.status === 'Won').length;
    const losses = bettingsData.filter(betting => betting.status === 'Lost').length;
    const totalRewards = bettingsData.filter(betting => betting.status === 'Won').reduce((acc, curr) => acc + curr.amount, 0);

    setTotalBettingsDone(bettingsData.length);
    setTotalWins(wins);
    setTotalLoses(losses);
    setTotalRewardsEarned(totalRewards);
  }, []);

  useEffect(() => {
    let items = new Array<any>();
    let totalLosses = 0;
    let totalWins = 0;
    let totalBets = 0;
    participants.map((participant) => {
      if (participant.address == address) {
        let title = "UNKNOWN";
        bettings.forEach((betting) => {
          if (betting.id == participant.id) {
            title = betting.name;
          }
        })
        items.push({ ...participant, ["name"]: title });

        if (participant.status == "Win") {
          totalWins += 1;
        } else if (participant.status == "Lose") {
          totalLosses += 1;
        }
        totalBets += 1;
      }
    });
    setBettingData(items);
    setTotalWins(totalWins);
    setTotalLoses(totalLosses);
    setTotalBettingsDone(totalBets);
  }, [address, participants, bettings]);


  const calls = useMemo(() => {
    if (!address || !bettingContract || claimId === null) return [];
    return bettingContract.populateTransaction["claimWinnings"]!(claimId, address);
  }, [address, bettingContract, claimId]);

  const {
    writeAsync
  } = useContractWrite({
    calls,
  });


  const onClaim = async (id: Number) => {
    setClaimId(id);

    setTimeout(() => { }, 1000);

    const res = await writeAsync();
    console.log("Transaction Hash: ", res.transaction_hash);

    const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
    let wait_for = await myProvider.waitForTransaction(res.transaction_hash);

    //TODO: Store the claim status in DB

    console.log(id);
  }

  return (
    <div className="p-5 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label="Total Bettings Done" value={totalBettingsDone} />
        <Stat label="Total Wins" value={totalWins} />
        <Stat label="Total Losses" value={totalLoses} />
        <Stat label="Total Rewards Earned" value={`${totalRewardsEarned} $STRK`} />
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Match</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bettingData.map(betting => (
              <TableRow key={betting.betId}>
                <TableCell>{betting.name}</TableCell>
                <TableCell>${betting.amount}</TableCell>
                <TableCell>{betting.status}</TableCell>
                <TableCell>
                  <Button variant={"black"} onClick={() => onClaim(betting.betId)}>Claim</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Page;
