"use server"
import { connectToDB } from "../connectToDb";
import Athlete from "../models/Athlete";
import Campaign from "../models/Campaign";

export async function createAthlete(newAthlete: any) {
    console.log("Storing in DB",newAthlete);
    connectToDB();
    const athlete=new Athlete(newAthlete);
    await athlete.save()
    .then(()=>{
        console.log("Data Saved Successfully");
    })
    .catch((err:any)=>{
        console.log("error in saving the products to the db", err);
    });
}

export async function storeCampaignDetails(newCampaign: any) {
    console.log("Storing in DB",newCampaign);
    connectToDB();
    const campaign=new Campaign(newCampaign);
    await campaign.save()
    .then(()=>{
        console.log("Data Saved Successfully");
    })
    .catch((err:any)=>{
        console.log("error in saving the products to the db", err);
    });
}