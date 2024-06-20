import mongoose from "mongoose";

const AthleteSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required:true
    }
})

const Athlete=mongoose.models.Athlete||mongoose.model("Athlete",AthleteSchema);

export default Athlete;