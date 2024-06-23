"use server"
import { connectToDB } from "../connectToDb";
import Campaign from "../models/Campaign";
import Participant from "../models/Participant";

export async function storeDonatedAmount (id:number, amount:number) {
    connectToDB();
    Campaign.findOne({id:id})
    .then((res:any)=>{
        console.log("found out the object",res);
        res.amountDonated+=amount;
        res.save()
        .then((data:any)=>{
            console.log("amount updated to the database", data);
        })
        .catch((err:any)=>{
            console.log("error in adding amount to the database",err);
        })
    })
    .catch((err:any)=>{
        console.log("error in finding the proposal",err);
    })
}

export async function storeParticipantDetails(id:number, address: string|undefined, betAmount: number, betOption: number){
    connectToDB();
    const participant= {
        betId:id,
        address: address,
        amount: betAmount,
        option: betOption
    }
    console.log(participant);
    const newParticipant=new Participant(participant);
    await newParticipant.save()
    .then(() => {
        console.log("Data Saved Successfully");
    })
    .catch((err: any) => {
        console.log("error in saving the products to the db", err);
    });
}