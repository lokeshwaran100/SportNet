import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    betId:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    option: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Win", "Lose", "InProgress"],
        required: true,
        default: "InProgress"
    }
});

const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

export default Participant;
