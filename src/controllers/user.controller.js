import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
const registerUser = asyncHandler(async (req, res, next) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists in the database
    // check for images , avatar
    // upload them in cloudinary
    // create entry in database
    // remove pass and refresh token from response
    // check for user creation 
    // return response
    const {fullName , username, email, password} = req.body;
    console.log("password : " , password);
    if ([fullName, username, email, password].includes("")) {
        throw new ApiError(400, "Please fill all fields");
    }
    res.status(201).json({
        success: true,
        message: "User registered successfully",
    });
})

export { registerUser };