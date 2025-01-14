import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {sendVerificationEmail} from "../mailtrap/email.js";
import {sendWelcomeEmail} from "../mailtrap/email.js";
import {sendPasswordResetEmail} from "../mailtrap/email.js";
import {sendResetSuccessEmail} from "../mailtrap/email.js";
import crypto from "crypto";
import dotenv from 'dotenv';
dotenv.config();
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ email });
    console.log("User Already exist", userAlreadyExists);

    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await user.save();

    //jwt

    generateTokenAndSetCookie(res, user._id);
    await sendVerificationEmail(user.email, verificationToken);


    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({ success: false, message: err.message });
  }
};

export const verifyEmail = async(req,res)=>{
  const {code} = req.body;
  try{
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: {$gt: Date.now()},
    })
    if(!user){
      return res.status(400).json({success: false, message:"Invalid or expired verification code"});
    }

    user.isVerified = true;
    user.verifiationToken = undefined;
    user.verificationTokenExpiresAt= undefined;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);
    res.status(200).json({
      success:true,
      message: "Email verified succcessfully",
      user:{
        ...user._doc,
        password:undefined,
      },
    })
    
  }
  catch(error){
    console.log("error in verifying email" , error);
    res.status(500).json({success:false, message : " Server error"});
  }
}
export const login = async (req, res) => {
 const { email, password} = req.body;

 try {
  const user = await User.findOne({email}) ;
  if(!user){
     return res.status({success:false, message:"Invalid credentials"});
  }
  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if(!password){
    return res.status(400).json({success:false, message:"Invalid Credentials"});
  }
  generateTokenAndSetCookie(res, user._id);
  user.lastLogin = new Date();
  await user.save();
  res.status(200).json({
    success:true,
    message:"Logged in Successfully!",
    user:{
      ...user._doc,
      password:undefined,
    },
  })
  
 } catch (error) {
  console.log("error in login ",error);
  res.status(400).json({success:false, message:error.message});
 }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({success:true, message:"Logged out successfully"});
};


export const forgotPassword = async(req, res)=>{
  const {email} = req.body;
  try {
    
    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found!",
      });

    }
 //regernate user token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;
    await user.save();
    
// send mail

await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
res.status(200).json({
  succcess: true,
  message: "Password reset link sent to your email successfully",
});
   
  } catch (error) {
    console.log("Error in forgotpassword" , error);
    res.status(400).json({success:false, message : error.message});
  }

}

export const resetPassword =async(req,res)=>{
  try {
    const {token} = req.params;
    const {password} = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt : {$get: Date.now()},
    });
    if(!user){
      return res.status(400).json({
        success:false,
        message: " Invalid or expired reset token"
      });
    }

    const hashedPassword = await bcryptjs.hash(password,10);
    user.password = hashedPassword;
    user.resetPassword= undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({
      success:true,
      message: "password reset successful"
    })
  } catch (error) {
    console.log("Error in resetpassword", error);
    res.status(400).json({
      success:false,
      message:error.message
    });
  }
}