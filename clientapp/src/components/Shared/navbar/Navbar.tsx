'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import WalletConnectBar from "@/components/WalletConnectBar";
import { AlertDialogModal } from "@/components/custom/AlertDialogModal";
import { useAthleteContext } from "../../../../context/AthleteContext";
import RegisterAthlete from "../ui/RegisterAthlete";
import RaiseFund from "../ui/RaiseFund";
import CreateNewBetMarket from "../ui/CreateNewBetMarket";

const enum UserType {
  USER,
  OWNER,
  ATHLETE
}

export const Navbar = () => {
  const { athletes } = useAthleteContext();
  const [userType, setUserType] = useState(UserType.USER);
  const pathname = usePathname();
  const { address } = useAccount();
  const [selected, setSelected] = useState(() => {
    if (pathname === "/") {
      return "home";
    }
    if (pathname.includes("/sponsor")) {
      return "sponsor";
    }
    if (pathname.includes("/bet")) {
      return "bet";
    }
    if (pathname.includes("/roadmap")) {
      return "roadmap";
    }
    if (pathname.includes("/about")) {
      return "about";
    }
  });

  useEffect(() => {
    checkUser();
    console.log("The user address is", address);
  }, [address]);

  const checkUser = () => {
    console.log(address)
    if (athletes.find((athlete: any) => athlete.address === address)) {
      setUserType(UserType.ATHLETE);
    } else if (address === "0x6e577ed701a36f88a478fbfb78d083b36fc1ad4f937c201d3076939f26b4316") {
      setUserType(UserType.OWNER);
    } else {
      setUserType(UserType.USER);
    }
  };

  return (
    <nav className="bg-purple-700 text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" passHref>
            <h1 className="font-bold text-2xl cursor-pointer">SportNet</h1>
          </Link>
        </div>
        <ul className="flex gap-5 md:gap-10 text-lg overflow-x-auto">
          <Link href="/" passHref>
            <li
              className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "home" && "text-gray-300"}`}
              onClick={() => setSelected("home")}
            >
              <Image src="/images/ath.svg" alt="Home" width={20} height={20} />
              Home
            </li>
          </Link>
          {address ? (
            <>
              {userType !== UserType.ATHLETE && (
                <Link href="/sponsor" passHref>
                  <li
                    className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "sponsor" && "text-gray-300"}`}
                    onClick={() => setSelected("sponsor")}
                  >
                    <Image src="/images/spons.svg" alt="Sponsor" width={20} height={20} />
                    Sponsor
                  </li>
                </Link>
              )}
            </>
          ) : (
            <AlertDialogModal
              title="Connect Wallet"
              content="Please connect your wallet to sponsor an athlete"
              buttonText="Okay"
            >
              <li className="flex items-center gap-2 link-animate hover:text-gray-300 cursor-pointer">
                <Image src="/images/wallet.svg" alt="Sponsor" width={20} height={20} />
                Sponsor
              </li>
            </AlertDialogModal>
          )}
          {address ? (
            <>
              {userType !== UserType.ATHLETE && (
                <Link href="/bet" passHref>
                  <li
                    className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "bet" && "text-gray-300"}`}
                    onClick={() => setSelected("bet")}
                  >
                    <Image src="/images/bet-icon.svg" alt="Bet" width={20} height={20} />
                    Bet
                  </li>
                </Link>
              )}
            </>
          ) : (
            <AlertDialogModal
              title="Connect Wallet"
              content="Please connect your wallet to bet on athlete"
              buttonText="Okay"
            >
              <li className="flex items-center gap-2 link-animate hover:text-gray-300 cursor-pointer">
                <Image src="/images/bet.svg" alt="Bet" width={20} height={20} />
                Bet
              </li>
            </AlertDialogModal>
          )}
          {address && userType === UserType.ATHLETE && (
            <Link href="/athlete" passHref>
              <li
                className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "athlete" && "text-gray-300"}`}
                onClick={() => setSelected("athlete")}
              >
                <Image src="/images/ath.svg" alt="Athlete" width={20} height={20} />
                Athlete
              </li>
            </Link>
          )}
          <Link href="#roadmap" passHref>
            <li
              className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "roadmap" && "text-gray-300"}`}
              onClick={() => setSelected("roadmap")}
            >
              <Image src="/images/roadmap.svg" alt="Roadmap" width={20} height={20} />
              Roadmap
            </li>
          </Link>
          <Link href="/about" passHref>
            <li
              className={`flex items-center gap-2 link-animate hover:text-gray-300 ${selected === "about" && "text-gray-300"}`}
              onClick={() => setSelected("about")}
            >
              <Image src="/images/about.svg" alt="About" width={20} height={20} />
              About
            </li>
          </Link>
        </ul>
        <div className="flex gap-5 my-auto h-full">
          {address && userType === UserType.ATHLETE && <RaiseFund address={address} />}
          {address && userType === UserType.USER && <RegisterAthlete address={address} />}
          {address && userType === UserType.OWNER && <CreateNewBetMarket />}
          <WalletConnectBar />
        </div>
      </div>
    </nav>
  );
};
