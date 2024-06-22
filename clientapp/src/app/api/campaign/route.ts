import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/connectToDb";
import Campaign from "@/lib/models/Campaign";
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from "url";

export const revalidate: number = 0;

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    try {
        let athlete_ = null;
        if (req.url) {
            const parsedUrl = parse(req.url, true);
            const { athlete } = parsedUrl.query;
            athlete_ = athlete
        }
        console.log(athlete_)
        await connectToDB();
        let data;
        if (athlete_) {
            data = await Campaign.find({address: athlete_});
        } else {
            data = await Campaign.find();
        }
    
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
