"use client";
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { createAthlete } from '@/lib/Server/AthleteActions';
import { useContractWrite } from "@starknet-react/core";
import { abi as SportNetFundingAbi } from "../../contract/funding/target/dev/funding_SportNetCrowdFunding.contract_class.json"
import { RpcProvider, types, RPC, events, num, hash, Contract, CallData } from "starknet";
import { useMemo } from "react";
import axios from 'axios';
import { Athlete } from '@/lib/types/Entity';

// Define the context type
interface AthleteContextType {
  // Define any properties or methods that the context should have
  athletes: Athlete[];
  myCampaigns: any[];
  contract: any;
}

// Creating the context with an initial value
const AthleteContext = createContext<AthleteContextType | undefined>(undefined);

// Create a context provider component
interface AthleteContextProviderProps {
  children: ReactNode;
}

// Provider for the user context
export const AthleteContextProvider: React.FC<AthleteContextProviderProps> = ({ children }) => {
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [myCampaigns,setMyCampaigns]=React.useState([]);
  const { address } = useAccount();

  const url=process.env.NEXT_PUBLIC_URL;
  const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
  const SCALE_FACTOR = BigInt(10 ** 18);

  function toBigIntAmount(amount: number) {
    return BigInt(Math.round(amount * Number(SCALE_FACTOR)));
  }

  const { contract } = useContract({
    abi: SportNetFundingAbi,
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  });

  useEffect(()=>{
    fetchAthletes();
    console.log("the fetched athletes are", athletes);
  },[address]);

  useEffect(()=>{
    fetchMyCampaigns(address);
    console.log("the featched campaigns are", myCampaigns);
  },[address]);

  const fetchMyCampaigns = async (address: any) => {
    const res = await axios.get(`${url}api/campaign?athlete=` + address);
    console.log("Campaign Details: ", res.data.message);
    setMyCampaigns(res.data.message);
  }

  const fetchAthletes = async () => {
    const res=await axios.get(`${url}api/athlete`);
    console.log("details from the database",res.data.message);
    setAthletes(res.data.message);
  }

  return <AthleteContext.Provider value={{myCampaigns, athletes, contract}}>{children}</AthleteContext.Provider>;
};

// Custom hook for accessing the user context 
export const useAthleteContext = (): AthleteContextType => {
  const context = useContext(AthleteContext);
  if (!context) {
    throw new Error('useAthleteContext must be used within an AthleteContextProvider');
  }
  return context;
};