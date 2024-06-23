"use client"
import React, { useMemo } from 'react'
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from 'axios';
import { useAthleteContext } from '../../../context/AthleteContext';
import { useContractWrite } from '@starknet-react/core';


const campaignsData = [
  // Sample data
  { id: 0, name: 'Flight Ticket', funds: 1000, sponsors: 10, isClaimed: true },
  { id: 1, name: 'Lifting Shoes', funds: 1500, sponsors: 12, isClaimed: false },
];

const Page = () => {
  const [sponsorCount, setSponsorCount] = useState(0);
  const [totalFunds, setTotalFunds] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [bettingRevenue, setBettingRevenue] = useState(0);
  const { myCampaigns } = useAthleteContext();
  const [campaignId, setCampaignId] = useState(0);

  useEffect(() => {

    // Calculate additional metrics
    const totalSponsors = campaignsData.reduce((acc, campaign) => acc + campaign.sponsors, 0);
    const totalSponsoredFunds = campaignsData.reduce((acc, campaign) => acc + campaign.funds, 0);

    setSponsorCount(totalSponsors);
    setTotalFunds(totalSponsoredFunds);
    setReputation(75); // Sample reputation score
    setBettingRevenue(2000); // Sample betting revenue
  }, []);

  const { contract } = useAthleteContext();


  const calls = useMemo(() => {
    //   console.log("the args are", ...args);
    if (!contract) return [];
    return contract.populateTransaction["claim"]!(campaignId);
  }, [contract, campaignId]);

  const {
    writeAsync,
    data: contractData,
    isPending,
  } = useContractWrite({
    calls,
  });

  const handleClaim = async (id: any) => {
    console.log(`Claim funds for campaign ${id}`);
    setCampaignId(id);
    const res = await writeAsync();
    console.log(res)
  };

  return (
    <div className="p-5 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Total Sponsors</h3>
            <p className="text-2xl font-bold">{sponsorCount}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Total Campaigns</h3>
            <p className="text-2xl font-bold">{myCampaigns.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Total Sponsored Funds</h3>
            <p className="text-2xl font-bold">{totalFunds} $STRK</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Betting Platform Revenue</h3>
            <p className="text-2xl font-bold">{bettingRevenue} $STRK</p>
          </div>
        </Card>
      </div>
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-medium">Athlete Reputation</h3>
          <p className="text-2xl font-bold">{reputation}</p>
          <Progress value={reputation} className="mt-2" />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Funds</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myCampaigns && myCampaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.title}</TableCell>
                  <TableCell>{campaign.description}</TableCell>
                  <TableCell>${campaign.amount}</TableCell>
                  <TableCell>
                    {campaign.isClaimed ? (
                      <Button disabled>Claimed</Button>
                    ) : (
                      <Button variant={"black"} onClick={() => handleClaim(campaign.id)}>Claim</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Page;
