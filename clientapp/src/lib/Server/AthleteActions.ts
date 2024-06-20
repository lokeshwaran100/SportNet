"use server"
import Athlete from "../models/Athlete";
import { connectToDB } from "../connectToDb";

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