import mongoose from "mongoose";

const BettingSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    athlete: {
        type: String,
        required: true
    },
    option_01: {
        type: String,
        required: true,
        default: "Win"
    },
    option_02: {
        type: String,
        required: true,
        default: "Lose"
    },
    min_bet: {
        type: Number,
        required: true
    },
    resolved: {
        type: Boolean,
        required: true,
        default: false
    }
})

const Betting = mongoose.models.Betting || mongoose.model("Betting", BettingSchema);

export default Betting;