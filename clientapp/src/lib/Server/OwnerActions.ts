"use server"
import { connectToDB } from "../connectToDb";
import Betting from "../models/Betting";

export async function storeNewBettingDetails(newBetting: any) {
    console.log("Storing in DB", newBetting);
    connectToDB();
    const betting = new Betting(newBetting);
    await betting.save()
        .then(() => {
            console.log("Data Saved Successfully");
        })
        .catch((err: any) => {
            console.log("error in saving the products to the db", err);
        });
}