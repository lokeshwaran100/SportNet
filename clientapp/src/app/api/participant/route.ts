import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDb";
import Participant from "@/lib/models/Participant";
import { NextApiRequest, NextApiResponse } from 'next';

export const revalidate: number = 0;

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    try {
        await connectToDB();
    const data= await Participant.find();
        return NextResponse.json({
            message: data
        }, {
            status: 200
        });
    } catch (err) {
        console.log("error in the api get request",err);
        return NextResponse.json({
            message: "There was some form of an error"
        }, {
            status: 500
        });
    }
}
