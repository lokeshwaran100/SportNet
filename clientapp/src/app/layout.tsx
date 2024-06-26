import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StarknetProvider } from "@/components/starknet-provider";
import "./globals.css";
import { Navbar } from "@/components/Shared/navbar/Navbar";
import Footer from "@/components/Shared/footer/Footer";
import { AthleteContextProvider } from "../../context/AthleteContext";
import { UserContextProvider } from "../../context/UserContext";
import { OwnerContextProvider } from "../../context/OwnerContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SportNet",
  description: "One Of a Kind Crowdfunding and Betting Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white flex flex-col min-h-screen`}>
        <StarknetProvider>
          <AthleteContextProvider>
            <UserContextProvider>
              <OwnerContextProvider>
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </OwnerContextProvider>
            </UserContextProvider>
          </AthleteContextProvider>
        </StarknetProvider>
      </body>
    </html>
  );
}
