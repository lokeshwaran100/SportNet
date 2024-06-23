"use client"
import React from 'react'

// pages/owner-dashboard.js

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const recentFeesData = [
  // Sample data
  { id: 1, type: 'Campaign', amount: 50, date: '2024-06-01' },
  { id: 2, type: 'Betting', amount: 100, date: '2024-06-02' },
  { id: 3, type: 'Campaign', amount: 75, date: '2024-06-03' },
  { id: 4, type: 'Betting', amount: 200, date: '2024-06-04' },
  { id: 5, type: 'Campaign', amount: 60, date: '2024-06-05' },
  { id: 6, type: 'Betting', amount: 150, date: '2024-06-06' },
  { id: 7, type: 'Campaign', amount: 85, date: '2024-06-07' },
  { id: 8, type: 'Betting', amount: 90, date: '2024-06-08' },
  { id: 9, type: 'Campaign', amount: 40, date: '2024-06-09' },
  { id: 10, type: 'Betting', amount: 120, date: '2024-06-10' },
];

// components/Stat.js

const Stat = ({ label, value }: { label: any, value: any }) => (
  <div className="bg-white p-4 rounded shadow">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

const Page = () => {
  const [totalCampaignFee, setTotalCampaignFee] = useState(0);
  const [totalBettingFee, setTotalBettingFee] = useState(0);
  const [totalSponsors, setTotalSponsors] = useState(0);
  const [totalSponsored, setTotalSponsored] = useState(0);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [bettingRevenueShared, setBettingRevenueShared] = useState(0);

  useEffect(() => {
    // Fetch data from API or state and calculate the totals
    setTotalCampaignFee(500); // Sample total campaign fee
    setTotalBettingFee(1000); // Sample total betting fee
    setTotalSponsors(100); // Sample total sponsors
    setTotalSponsored(5000); // Sample total sponsored funds
    setTotalAthletes(20); // Sample total athletes
    setBettingRevenueShared(800); // Sample betting revenue shared
  }, []);

  return (
    <div className="p-5 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Stat label="Total Campaign Fee Collected" value={`$${totalCampaignFee}`} />
        <Stat label="Total Betting Fee Collected" value={`$${totalBettingFee}`} />
        <Stat label="Total Sponsors on Platform" value={totalSponsors} />
        <Stat label="Total Sponsored to Athletes" value={`$${totalSponsored}`} />
        <Stat label="Total Onboarded Athletes" value={totalAthletes} />
        <Stat label="Betting Revenue Shared with Sponsors" value={`$${bettingRevenueShared}`} />
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentFeesData.map(fee => (
              <TableRow key={fee.id}>
                <TableCell>{fee.type}</TableCell>
                <TableCell>${fee.amount}</TableCell>
                <TableCell>{fee.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Page;
