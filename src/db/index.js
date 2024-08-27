import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance =  await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`)
        console.log(`\nConnected to DB !! DB host : ${connectionInstance.connection.host}`);
        // console.log(connectionInstance.connection);
    } catch (error) {
        console.error("error :- ", error);
        process.exit(1);
    }
};

export default connectDB;