import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadResult } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

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

    if(!(email || username)){
        throw new ApiError(400,"Please provide email or username");
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

    const {accessToken , refreshToken} = await generateAccessAndRefereshTokens(user._id);

    // Save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

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
    }

    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200, {} , "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req , res) => {
    const {oldPassword , newPassword} =  req.body;
    const user = User.findById(req.user?._id);
    const isPasswordMatched = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordMatched){
        throw new ApiError(400 , "Password is incorrect");
    }
    user.password = newPassword;
    user.save({validateBeforeSave : false});
    return res.status(200)
    .json(
        new ApiResponse(202 , {} ,"Password Updated")
    )
})

const getCurrentUser = async (req , res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "current User fetched succesfully"
        )
    )
}

const updateAccountDetails = asyncHandler(async (req , res) => {
    const {fullName , email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400 , "required all fields")
    }
    const user = await User.findByIdAndUpdate(req.user?._id , 
        {
            $ser : {
                fullName : fullName,
                email : email
            }
        },
        {new : true}
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Account Details Updates Succesfully"
        )
    )
})

const updateUserAvatar = asyncHandler(async (req,res)=> {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "Please upload avatar image");
    }
    // delete old avatar from cloudinary

    const avatar = await uploadResult(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400 , "Error in uploading avatar image");
    }

    const user  = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true},
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated Successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler(async (req,res)=> {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400 , "Please upload Cover Image image");
    }

    // delete old coverImage from cloudinary

    const coverimage = await uploadResult(coverImageLocalPath);
    if(!coverimage){
        throw new ApiError(400 , "Error in uploading coverImage image");
    }

    const user  = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverimage : coverimage.url
            }
        },
        {new : true},
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "coverimage updated Successfully"
        )
    )
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};