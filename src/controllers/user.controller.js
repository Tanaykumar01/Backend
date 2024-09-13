import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadResult } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findOne({_id: userId});
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken , refreshToken};
    } catch(error){
        throw new ApiError(500,"Error while generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists in the database
    // check for images , avatar
    // upload them in cloudinary
    // create entry in database
    // remove pass and refresh token from response
    // check for user creation 
    // return response
    const { fullName, username, email, password } = req.body;
    if ([fullName, username, email, password].includes("")) {
        throw new ApiError(400, "Please fill all fields");
    }
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please upload avatar image");
    }
    const avatar = await uploadResult(avatarLocalPath);
    const coverImage = await uploadResult(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error in uploading avatar image");
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const UserResponse = await User.findById(user._id).select("-password -refreshToken");
    if (!UserResponse) {
        throw new ApiError(500, "Error in creating user");
    }
    return res.status(201).json(
        new ApiResponse(200, UserResponse, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user exists in the database
    // check password
    // create access token
    // create refresh token
    // send cookies
    // save refresh token in database
    // remove pass and refresh
    // return response
    const {email , username ,password} = req.body;
    
    if([email, username ,password].includes("")){
        throw new ApiError(400,"Please fill all the required fields");
    }
    const user = await User.findOne({
        $or : [{email} , {username}]
    });
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const isPasswordMatched  = await user.isPasswordCorrect(password);
    if(!isPasswordMatched){
        throw new ApiError(401,"Password is incorrect");
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).cookie("refreshToken" , refreshToken , options).cookie("accessToken" , accessToken , options).json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken , refreshToken
            },
            "User logged in successfully"
        )    
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id , 
        {
            refreshToken : undefined
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
        expires : new Date(0)
    }

    return res.sataus(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200, {} , "User logged out successfully")
    )
})



export { registerUser , loginUser , logoutUser};