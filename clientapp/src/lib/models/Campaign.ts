import mongoose from "mongoose";

const CampaignSchema=new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    currentDonation:{
        type: Number,
        required: true,
        default: 0
    },
    amount: {
        type: Number,
        required: true
    },
    equipment: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required:true
    },
    id: {
        type: Number,
        required: true
    },
    isClaimed: {
        type: Boolean,
        required: true,
        default: false
    }
})

const Campaign=mongoose.models.Campaign||mongoose.model("Campaign",CampaignSchema);

export default Campaign;