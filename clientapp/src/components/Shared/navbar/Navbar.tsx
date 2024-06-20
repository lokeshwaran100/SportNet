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

export const Navbar = () => {
    const pathname=usePathname();
    const [selected,setSelected]=useState(()=>{
        if(pathname==="/"){
          return "home"
        }
        if(pathname.includes("/donate")){
          return "donate"
        }
        if(pathname.includes("/contact")){
          return "contact"
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
            <Link href={"/donate"}>
            <li className={` hover:text-uiprimary text-base ${selected==="donate"&&"text-uiprimary"}`} onClick={()=>setSelected("donate")}>Donate</li>
            </Link>
            <Link href={"/contact"}>
            <li className={` hover:text-uiprimary text-base ${selected==="contact"&&"text-uiprimary"}`} onClick={()=>setSelected("contact")}>Contact Us</li>
            </Link>
            <Link href={"/about"}>
            <li className={` hover:text-uiprimary text-base ${selected==="about"&&"text-uiprimary"}`} onClick={()=>setSelected("about")}>
              About
            </li>
            </Link>
        </ul>
        <div className="flex gap-5 my-auto h-full">
          <WalletConnectBar/>
        </div>
      </NavContainer>
    );
  };