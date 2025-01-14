import { mailtrapClient,sender} from './mailtrap.config.js';
import {VERIFICATION_EMAIL_TEMPLATE,PASSWORD_RESET_SUCCESS_TEMPLATE,PASSWORD_RESET_REQUEST_TEMPLATE} from './emailTemplates.js';

export const  sendVerificationEmail = async(email, verificationToken) =>{
    const recipient = [{email}];

    try{
        const response = await mailtrapClient.send({
            from: sender,
            to : recipient,
            subject:"Verify your email",
            html:VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email verification"
        })
        console.log("Email sent successfully", response);
    }
    catch(error){
        console.log(`Error sending verification , ${error}`);
        throw new Error(`Error sending verification email: ${error}`);
    }
}

export const sendWelcomeEmail = async( email, name)=>{
    const recipient =[{email}];
    try{
       const response =  await mailtrapClient.send({
            from:sender,
            to:recipient,
            template_uuid: "63209264-ad35-4064-92c8-fd57a169bcd8",
            template_variables: {
                "company_info_name": "Uranium Software PVT LTD",
                "name": "name"
              },
        });
        console.log("Welcome email sent successfully", response);
    }
    catch(error){
        throw new Error(`Error sending welcome email: ${error}`);
    }
}

export const sendPasswordResetEmail = async(email,resetURL)=>{
    const recipient = [{email}];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to : recipient,
            subject:"Reset your password",
            html:PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset"
        })
        console.log("Password changed successfully", response);
    } catch (error) {
        throw new Error(`Error sending welcome email: ${error}`);
    }
}

export const sendResetSuccessEmail = async(email)=>{
    const recipient = [{email}];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to : recipient,
            subject:"Password Reset Successful",
            html:PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset successful"
        })
        console.log("Password reset email successful", response);
    } catch (error) {
        throw new Error(`Error sending welcome email: ${error}`);
    }
}