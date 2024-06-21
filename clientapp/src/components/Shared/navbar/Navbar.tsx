"use client";
import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { loadPropertyListing, setInitialPropertyListingsLoaded } from "@/store/slices/homeSlice";
import { Check, ChevronDown } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { GetTransactionProvider } from "@/helpers/wallet/GetTransactionProvider";
// import { addListing } from "@/actions/addListing";
import { usePathname } from "next/navigation";
import { NavContainer } from "@/components/containers/Containers";
import WalletConnectBar from "@/components/WalletConnectBar";
import { Button } from "@/components/ui/button";
import { AlertDialogModal } from "@/components/custom/AlertDialogModal";
import { useAccount } from "@starknet-react/core";
import { useAthleteContext } from "../../../../context/AthleteContext";
import RegisterAthlete from "../ui/RegisterAthlete";
import RaiseFund from "../ui/RaiseFund";

export const Navbar = () => {
  const {athletes}=useAthleteContext();
  const [isAthlete,setIsAthlete]=useState(false);
    const pathname=usePathname();
    const {address}= useAccount();
    const [selected,setSelected]=useState(()=>{
        if(pathname==="/"){
          return "home"
        }
        if(pathname.includes("/sponsor")){
          return "sponsor"
        }
        if(pathname.includes("/bet")){
          return "bet"
        }
        if(pathname.includes("/about")){
          return "about"
        }
    });

    useEffect(()=>{
      checkIsAthlete();
      console.log("The user address is", address);
    },[address]);

    const checkIsAthlete = () => {
      if(athletes.find((athlete: any)=>athlete.address===address)){
        setIsAthlete(true);
      }
    }

    return (
    <NavContainer className=" max-w-10xl mx-auto ">
        <div className="flex gap-16 items-center">
          <h1 className="font-bold text-2xl text-uiprimary">SportNet</h1>
        </div>
        <ul className=" flex gap-8 tracking-wider">
            <Link href={"/"}>
            <li className={` hover:text-uiprimary text-base ${selected==="home"&&"text-uiprimary"}`} onClick={()=>setSelected("home")}>Home</li>
            </Link>
            {address?(<>{!isAthlete&&<Link href={"/sponsor"}>
            <li className={` hover:text-uiprimary text-base ${selected==="sponsor"&&"text-uiprimary"}`} onClick={()=>setSelected("sponsor")}>Sponsor</li>
            </Link>}</>):(<AlertDialogModal title="Connect Wallet" content="Please connect your wallet to sponsor an athlete" buttonText="Okay"><li className={` hover:text-uiprimary text-base cursor-pointer`}>Sponsor</li></AlertDialogModal>)}
            {address?(<>{!isAthlete&&<Link href={"/bet"}>
            <li className={` hover:text-uiprimary text-base ${selected==="sponsor"&&"text-uiprimary"}`} onClick={()=>setSelected("sponsor")}>Bet</li>
            </Link>}</>):(<AlertDialogModal title="Connect Wallet" content="Please connect your wallet to bet on athlete" buttonText="Okay"><li className={`hover:text-uiprimary text-base cursor-pointer`}>Bet</li></AlertDialogModal>)}
            {address&&isAthlete&&<Link href={"/athlete"}><li className={` hover:text-uiprimary text-base ${selected==="home"&&"text-uiprimary"}`} onClick={()=>setSelected("athlete")}>Athlete</li></Link>}
            <Link href={"/about"}>
            <li className={` hover:text-uiprimary text-base ${selected==="about"&&"text-uiprimary"}`} onClick={()=>setSelected("about")}>
              About
            </li>
            </Link>
        </ul>
        <div className="flex gap-5 my-auto h-full">
          <WalletConnectBar/>
          {address&&isAthlete&&<Button>Create Campaign</Button>}
          {address&&!isAthlete&&<RegisterAthlete/>}
        </div>
      </NavContainer>
    );
  };