import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadResult } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
    const existedUser = await User.findOne({
        $or : [{email}, {username}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Please upload avatar image");
    }
    const avatar = await uploadResult(avatarLocalPath);
    const coverImage = await uploadResult(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Error in uploading avatar image");
    }
    const user = await User.create({
        fullName,
        username : username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })
    const UserResponse = user.findOne(user._id).select("-password -refreshToken");
    if(!UserResponse){
        throw new ApiError(500, "Error in creating user");
    }
    res.status(201).json({
        success: true,
        message: "User registered successfully",
    });
})

export { registerUser };