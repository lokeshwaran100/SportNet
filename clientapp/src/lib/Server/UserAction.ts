"use server"
import { connectToDB } from "../connectToDb";
import Campaign from "../models/Campaign";

export async function donateAmount(id:number, amount:number) {
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