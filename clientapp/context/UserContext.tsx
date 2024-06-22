
"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

// context type
interface UserContextType {
}

// Creating the context with an initial value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a context provider component
interface UserContextProviderProps {
  children: React.ReactNode;
}

// provider for the user context
export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
  const [allCampaigns,setAllCampaigns]=useState([]);
  const [allBets,setAllBets]=useState([]);
  
  useEffect(()=>{
    fetchCampaigns();
    fetchBets();
  },[]);

  const fetchBets=()=>{

  }
  const fetchCampaigns=()=>{

  }

  const sponsorAthlete=(sponsorData: any)=>{
    console.log("the sponsor data is", sponsorData);
  }
  const placeBet=(bet: any)=>{ 
    console.log("the bet data is", bet);
  }
  
  // add all the function here
  return <UserContext.Provider value={{}}>{children}</UserContext.Provider>;
};

// custom hook for accessing the user context 
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
