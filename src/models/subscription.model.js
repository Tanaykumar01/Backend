import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
    subscriber : {
        type :mongoose.Schema.Types.ObjectId, // one who is suscribing
        ref : "User",
    },
    channel : {
        type : mongoose.Schema.Typpes.ObjectId, // one who get suscribed
        ref : "User"
    }
}, {timestamps : true});

const Subscription = mongoose.model("Subscription" , SubscriptionSchema);

export {Subscription};