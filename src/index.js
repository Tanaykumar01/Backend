import mongoose from "mongoose";
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "/.env"
});
const app = express();

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.error("Database connection error : ", err);
});

/*
const app = express();
;(async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`)
        app.on("error", (error) => {
            console.log("err : " , error);
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error(error);
        throw error;
    }
})()
*/