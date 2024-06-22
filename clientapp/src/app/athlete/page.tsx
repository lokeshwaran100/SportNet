"use client"
import React from 'react'
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


const campaignsData = [
  // Sample data
  { id: 1, name: 'Flight Ticket', funds: 1000, sponsors: 10, claimable: true },
  { id: 2, name: 'Lifting Shoes', funds: 1500, sponsors: 12, claimable: false },
];

const page = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [sponsorCount, setSponsorCount] = useState(0);
  const [totalFunds, setTotalFunds] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [bettingRevenue, setBettingRevenue] = useState(0);

  useEffect(() => {
    // Fetch campaigns from API or state
    setCampaigns(campaignsData);

    // Calculate additional metrics
    const totalSponsors = campaignsData.reduce((acc, campaign) => acc + campaign.sponsors, 0);
    const totalSponsoredFunds = campaignsData.reduce((acc, campaign) => acc + campaign.funds, 0);

    setSponsorCount(totalSponsors);
    setTotalFunds(totalSponsoredFunds);
    setReputation(75); // Sample reputation score
    setBettingRevenue(2000); // Sample betting revenue
  }, []);

  const handleClaim = (id) => {
    console.log(`Claim funds for campaign ${id}`);
    // Implement claim logic here
  };

  return (
    <div className="p-5 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Sponsors Count</h3>
            <p className="text-2xl font-bold">{sponsorCount}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Total Sponsored Funds</h3>
            <p className="text-2xl font-bold">${totalFunds}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium">Betting Revenue</h3>
            <p className="text-2xl font-bold">${bettingRevenue}</p>
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
                <TableCell>Campaign Name</TableCell>
                <TableCell>Funds</TableCell>
                <TableCell>Sponsors</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>${campaign.funds}</TableCell>
                  <TableCell>{campaign.sponsors}</TableCell>
                  <TableCell>
                    {campaign.claimable ? (
                      <Button onClick={() => handleClaim(campaign.id)}>Claim</Button>
                    ) : (
                      <Button disabled>Claimed</Button>
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

export default page;
