import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const UserSchema = new mongoose.Schema({
    username : {
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true,
        index : true
    },
    email : {
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true
    },
    password : {
        type:String,
        required: [true , "Password is required"],

    },
    watchHistory : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    }],
    fullName : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type : String,
        required : true
    },
    coverImage : {
        type : String
    },
    refreshToken : {
        type : String
    }
}, {timestamps : true});

UserSchema.pre("save" ,async function(next){
    if(!this.isModified("password")){
        return next();
    }
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password , salt);
    next();
});

UserSchema.methods.isPasswordCorrect = async function (password){
    return bcrypt.compareSync(password , this.password);
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullName : this.fullName
    } , process.env.ACCESS_TOKEN_SECRET , {expiresIn : process.env.ACCESS_TOKEN_EXPIRY});
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id
    } , process.env.REFRESH_TOKEN_SECRET , {expiresIn : process.env.REFRESH_TOKEN_EXPIRY});
}

const User = mongoose.model("User" , UserSchema);

export default User;