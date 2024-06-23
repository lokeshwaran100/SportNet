
"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// context type
interface UserContextType {
  allCampaigns: any[];
  participants: any[];
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
  const [participants,setParticipants]=useState([]);
  
  const url=process.env.NEXT_PUBLIC_URL;

  useEffect(()=>{
    fetchCampaigns();
    fetchParticipants();
    // fetchBets();
  },[]);

  const fetchBets=()=>{

  }
  const fetchCampaigns=async()=>{
    const res=await axios.get(`${url}api/campaign`);
    const data=res.data.message;
    console.log("the fetched campaigns are", data);
    setAllCampaigns(data);
  }

  const fetchParticipants=async ()=>{
    const res=await axios.get(`${url}api/participant`);
    const data=res.data.message;
    console.log("the participants are fetched", data);
    setParticipants(data);
  }

  const sponsorAthlete=(sponsorData: any)=>{
    console.log("the sponsor data is", sponsorData);
  }
  const placeBet=(bet: any)=>{ 
    console.log("the bet data is", bet);
  }
  
  // add all the function here
  return <UserContext.Provider value={{allCampaigns, participants}}>{children}</UserContext.Provider>;
};

// custom hook for accessing the user context 
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
