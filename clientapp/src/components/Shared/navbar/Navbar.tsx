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
import { DialogModal } from "@/components/custom/DialogModal";
import RegisterAthlete from "../ui/RegisterAthlete";

export const Navbar = () => {
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
    return (
    <NavContainer className=" max-w-10xl mx-auto ">
        <div className="flex gap-16 items-center">
          <h1 className="font-bold text-2xl text-uiprimary">SportNet</h1>
        </div>
        <ul className=" flex gap-8 tracking-wider">
            <Link href={"/"}>
            <li className={` hover:text-uiprimary text-base ${selected==="home"&&"text-uiprimary"}`} onClick={()=>setSelected("home")}>Home</li>
            </Link>
            {address?(<Link href={"/sponsor"}>
            <li className={` hover:text-uiprimary text-base ${selected==="sponsor"&&"text-uiprimary"}`} onClick={()=>setSelected("sponsor")}>Sponsor</li>
            </Link>):(<AlertDialogModal title="Connect Wallet" content="Please connect your wallet to sponsor an athlete" buttonText="Okay"><li className={` hover:text-uiprimary text-base cursor-pointer`}>Sponsor</li></AlertDialogModal>)}
            {address?(<Link href={"/bet"}>
            <li className={` hover:text-uiprimary text-base ${selected==="sponsor"&&"text-uiprimary"}`} onClick={()=>setSelected("sponsor")}>Bet</li>
            </Link>):(<AlertDialogModal title="Connect Wallet" content="Please connect your wallet to bet on athlete" buttonText="Okay"><li className={`hover:text-uiprimary text-base cursor-pointer`}>Bet</li></AlertDialogModal>)}
            <Link href={"/about"}>
            <li className={` hover:text-uiprimary text-base ${selected==="about"&&"text-uiprimary"}`} onClick={()=>setSelected("about")}>
              About
            </li>
            </Link>
        </ul>
        <div className="flex gap-5 my-auto h-full">
          {address&&!isAthlete&&<RegisterAthlete/>}
          <WalletConnectBar/>
          {pathname==="/athlete"&&<Button>Create Campaign</Button>}
        </div>
      </NavContainer>
    );
  };