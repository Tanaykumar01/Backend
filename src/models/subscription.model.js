import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
    subscriber : {
        type :mongoose.Schema.Types.ObjectId,
        ref : "User",
    },
    channel : {
        type : mongoose.Schema.Typpes.ObjectId,
        ref : "User"
    }
}, {timestamps : true});

const Subscription = mongoose.model("Subscription" , SubscriptionSchema);

export {Subscription};