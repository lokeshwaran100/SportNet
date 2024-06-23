"use client";
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { abi as SportNetBettingAbi } from "../../contract/funding/target/dev/funding_SportNetBetting.contract_class.json"
import axios from 'axios';
import { Betting } from '@/lib/types/Entity';

// Define the context type
interface OwnerContextType {
  // Define any properties or methods that the context should have
  bettings: Betting[];
  bettingContract: any;
}

// Creating the context with an initial value
const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

// Create a context provider component
interface OwnerContextProviderProps {
  children: ReactNode;
}

// Provider for the user context
export const OwnerContextProvider: React.FC<OwnerContextProviderProps> = ({ children }) => {
  const [bettings, setBettings] = React.useState<Betting[]>([]);
  const [myCampaigns, setMyCampaigns] = React.useState([]);
  const { address } = useAccount();

  const url = process.env.NEXT_PUBLIC_URL;
  const SCALE_FACTOR = BigInt(10 ** 18);

  function toBigIntAmount(amount: number) {
    return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
  }

  const { contract: bettingContract } = useContract({
    abi: SportNetBettingAbi,
    address: process.env.NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS,
  });

  useEffect(() => {
    fetchBetting();
    console.log("the fetched bettings are", bettings);
  }, [address]);

  const fetchBetting = async () => {
    const res = await axios.get(`${url}api/betting`);
    console.log("details from the database", res.data.message);
    setBettings(res.data.message);
  }

  return <OwnerContext.Provider value={{ bettings, bettingContract }}>{children}</OwnerContext.Provider>;
};

// Custom hook for accessing the user context 
export const useOwnerContext = (): OwnerContextType => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwnerContext must be used within an OwnerContextProvider');
  }
  return context;
};