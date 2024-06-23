'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
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
        <ul className="flex gap-20 text-lg">
          <Link href="/" passHref>
            <li
              className={`link-animate hover:text-gray-300 ${selected === "home" && "text-gray-300"
                }`}
              onClick={() => setSelected("home")}
            >
              Home
            </li>
          </Link>
          {address ? (
            <>
              {!userType && (
                <Link href="/sponsor" passHref>
                  <li
                    className={`link-animate hover:text-gray-300 ${selected === "sponsor" && "text-gray-300"
                      }`}
                    onClick={() => setSelected("sponsor")}
                  >
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
              <li className="link-animate hover:text-gray-300 cursor-pointer">
                Sponsor
              </li>
            </AlertDialogModal>
          )}
          {address ? (
            <>
              {!userType && (
                <Link href="/bet" passHref>
                  <li
                    className={`link-animate hover:text-gray-300 ${selected === "sponsor" && "text-gray-300"
                      }`}
                    onClick={() => setSelected("sponsor")}
                  >
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
              <li className="link-animate hover:text-gray-300 cursor-pointer">
                Bet
              </li>
            </AlertDialogModal>
          )}
          {address && userType == UserType.ATHLETE && (
            <Link href="/athlete" passHref>
              <li
                className={`link-animate hover:text-gray-300 ${selected === "home" && "text-gray-300"
                  }`}
                onClick={() => setSelected("athlete")}
              >
                Athlete
              </li>
            </Link>
          )}
          <Link href="/about" passHref>
            <li
              className={`link-animate hover:text-gray-300 ${selected === "about" && "text-gray-300"
                }`}
              onClick={() => setSelected("about")}
            >
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
