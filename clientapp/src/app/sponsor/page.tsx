"use client"
import React, { useState } from 'react'
import { CardComponent } from '@/components/custom/Cards'
import { useUserContext } from '../../../context/UserContext'
import { Container } from '@/components/containers/Containers'
import SponsorFund from '@/components/Shared/ui/SponsorFund'

const Page = () => {
  const {allCampaigns}=useUserContext();

  return (
    <>
    <Container>
    <div className=" my-8">
      <h2 className="text-2xl font-bold tracking-tight ">Campaigns</h2>
      <p className="text-muted-foreground">
        Support a FundRaise today by donating 
      </p>
    </div>
    <div className=" grid grid-cols-1 md:grid-cols-3 mx-auto">
      {allCampaigns.map((campaign:any,index:number)=>(
        <CardComponent key={index} title={campaign.title} description={campaign.description} contents={[{header:"Amount",value:`${campaign.amount} STK`},{header:"Raised",value:`${campaign.amountDonated} STK`}]} isDonate={true} donationValues={{amount: campaign.amount,donatedAmount: campaign.amountDonated}}>
          <SponsorFund
            id={campaign.id}/>
        </CardComponent>
      ))}
    </div>
    </Container>
    </>
  )
}

export default Page