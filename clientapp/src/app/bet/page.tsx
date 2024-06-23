"use client"
import React, { useState } from 'react'
import { CardComponent } from '@/components/custom/Cards'
import { useOwnerContext } from '../../../context/OwnerContext'
import { Container } from '@/components/containers/Containers'
import SponsorFund from '@/components/Shared/ui/SponsorFund'
import Bet from '@/components/Shared/ui/Bet'
import { BetCardComponent } from '@/components/custom/BetCard'
import { useUserContext } from '../../../context/UserContext'

const Page = () => {
  const { bettings, bettingContract } = useOwnerContext();
  const {participants}=useUserContext();
  const [newBettings,setNewBettings]=useState(bettings.filter((bet)=>!participants.find((participant)=>participant.betId===bet.id)));

  return (
    <>
      <Container>
        <div className=" my-8">
          <h2 className="text-2xl font-bold tracking-tight ">Bettings</h2>
          <p className="text-muted-foreground">
            Bet on Athlete tournament performance and win rewards
          </p>
        </div>
        <div className=" grid grid-cols-1 gap-3 md:grid-cols-3 mx-auto">
          {bettings.map((betting: any, index: number) => (
            <BetCardComponent key={index} name={betting.name} description={betting.description} contents={[{ header: "Minimum Bet Amount", value: `${betting.min_bet} STRK` }]} >
              <Bet
                id={betting.id} />
            </BetCardComponent>
          ))}
        </div>
      </Container>
    </>
  )
}

export default Page