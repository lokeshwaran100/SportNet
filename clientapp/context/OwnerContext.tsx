"use client";
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { abi as SportNetFundingAbi } from "../../contract/funding/target/dev/funding_SportNetCrowdFunding.contract_class.json"
import axios from 'axios';
import { Athlete } from '@/lib/types/Entity';

// Define the context type
interface OwnerContextType {
  // Define any properties or methods that the context should have
  athletes: Athlete[];
  myCampaigns: any[];
  contract: any;
}

// Creating the context with an initial value
const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

// Create a context provider component
interface OwnerContextProviderProps {
  children: ReactNode;
}

// Provider for the user context
export const OwnerContextProvider: React.FC<OwnerContextProviderProps> = ({ children }) => {
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [myCampaigns, setMyCampaigns] = React.useState([]);
  const { address } = useAccount();

  const url = process.env.NEXT_PUBLIC_URL;
  const SCALE_FACTOR = BigInt(10 ** 18);

  function toBigIntAmount(amount: number) {
    return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
  }

  const { contract } = useContract({
    abi: SportNetFundingAbi,
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  });

  useEffect(() => {
    fetchAthletes();
    console.log("the fetched athletes are", athletes);
  }, [address]);

  useEffect(() => {
    fetchMyCampaigns(address);
    console.log("the featched campaigns are", myCampaigns);
  }, [address]);

  const fetchMyCampaigns = async (address: any) => {
    const res = await axios.get(`${url}api/campaign?athlete=` + address);
    console.log("Campaign Details: ", res.data.message);
    setMyCampaigns(res.data.message);
  }

  const fetchAthletes = async () => {
    const res = await axios.get(`${url}api/athlete`);
    console.log("details from the database", res.data.message);
    setAthletes(res.data.message);
  }

  return <OwnerContext.Provider value={{ myCampaigns, athletes, contract }}>{children}</OwnerContext.Provider>;
};

// Custom hook for accessing the user context 
export const useOwnerContext = (): OwnerContextType => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwnerContext must be used within an OwnerContextProvider');
  }
  return context;
};