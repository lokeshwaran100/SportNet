"use client";
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAccount, useContract, useNetwork } from '@starknet-react/core';
import { createAthlete } from '@/lib/Server/AthleteActions';
import { useContractWrite } from "@starknet-react/core";
import { abi as SportNetFundingAbi } from "../../contract/funding/target/dev/funding_SportNetCrowdFunding.contract_class.json"
import { useMemo } from "react";

// Define the context type
interface AthleteContextType {
  // Define any properties or methods that the context should have
  myCampaigns: any[];
  register: (registeredData: any) => void;
  createCampaign: (campaignData: any) => void;
}

// Creating the context with an initial value
const AthleteContext = createContext<AthleteContextType | undefined>(undefined);

// Create a context provider component
interface AthleteContextProviderProps {
  children: ReactNode;
}

// Provider for the user context
export const AthleteContextProvider: React.FC<AthleteContextProviderProps> = ({ children }) => {
  const [myCampaigns,setMyCampaigns]=React.useState([]);
  const { address } = useAccount();
  const { chain } = useNetwork();

  const { contract } = useContract({
    abi: SportNetFundingAbi,
    address: '0x030d0b10f64347c02dfb01fc509be7cb6dd83eafda366c851c6b56475fe170a8',
  });


  useEffect(()=>{
    console.log("the featched campaigns are", myCampaigns);
  },[myCampaigns]);

  const calls = useMemo(() => {
    if (!address || !contract) return [];
    return contract.populateTransaction["athlethe_register"]!();
  }, [contract, address]);

  const {
    writeAsync,
    data,
    isPending,
  } = useContractWrite({
    calls,
  });
  

  const fetchMyCampaigns = () => {

  }

  const register=async(registeredData: any)=>{
    try{
      const res=await writeAsync();
      console.log(res);
      console.log("the registered data is", registeredData);
      const newRegisteredData = {...registeredData, address: address};
      createAthlete(newRegisteredData);
    }
    catch(e){
      console.log("error occured", e);
    }
  }

  const createCampaign = (campaignData: any) =>{
    console.log("the campaign data is", campaignData);
  }

  return <AthleteContext.Provider value={{myCampaigns, register, createCampaign}}>{children}</AthleteContext.Provider>;
};

// Custom hook for accessing the user context 
export const useAthleteContext = (): AthleteContextType => {
  const context = useContext(AthleteContext);
  if (!context) {
    throw new Error('useAthleteContext must be used within an AthleteContextProvider');
  }
  return context;
};