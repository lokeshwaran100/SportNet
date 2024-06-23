"use server"
import { connectToDB } from "../connectToDb";
import Betting from "../models/Betting";

export async function storeNewBettingDetails(newBetting: any) {
    const newCustomBetting ={
        ...newBetting,
        participants: []
    }
    console.log("Storing in DB", newCustomBetting);
    connectToDB();
    const betting = new Betting(newCustomBetting);
    await betting.save()
        .then(() => {
            console.log("Data Saved Successfully");
        })
        .catch((err: any) => {
            console.log("error in saving the products to the db", err);
    });
}