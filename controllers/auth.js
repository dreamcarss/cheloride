const userModel = require("../models/userModel.js")
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken")
const fs = require("fs")
require("dotenv").config();
const mail = require("../utils/mailer")
const tokenModel = require("../models/tokenModel.js")

const SALT = process.env.SALT;


const register = async(req, res) => {
    try {
        const request = req;
        if(request.method === "GET"){
            res.render("register.ejs");
        }else if(request.method == "POST"){
            const body = request?.body;
            console.log(body)
            const user = await userModel.findOne({email: body.email})
            
            if(user){
              return res.status(400).json({ msg: "User Already Exists" });
            }

            let newUser = new userModel({
              username: body.username,
              email: body.email,
              phone: parseInt(body.phone),
              password: body.password,
              role: "User",
            });
            await newUser.save()
            const token = newUser.genToken();
            res.status(200).json({ "msg": "Account Registered", "token": token });
        }
    } catch (error) {
        console.log(error)
    }
}

const login = (req, res) => {
    try {
        const request = req;
    if (request.method === "GET") {
        res.render("login.ejs");
    } else if (request.method === "POST") {
        const body = request?.body;
        userModel.findOne({ email: body.email }).then(async (user) => {
        if (user != null) {
            const status = await bcryptjs.compare(body.password, user.password);
            if(status){
                const token = jwt.sign(user.email, SALT)
                res.status(200).json({"msg": "User logged in", "token": token})
            }else{
                res.status(403).json({"msg":"Invalid credintials"})
            }
        } else {
            res.status(400).json({ msg: "User not found" });
        }
        });
    }
    } catch (error) {
        console.log(error);
    }
}

const checkMail = async(req, res) => {
    try {
        if(req.method == "GET"){
            res.render("sendMail.ejs")
        }else{
            const email = req.body.email;
            await userModel.findOne({ email: email }).then(async (user) => {
              if (user != null) {
                let code = Math.floor(100000 + Math.random() * 900000);
                let token = jwt.sign({email: user.email, code: code}, SALT)
                const newToken = new tokenModel({
                    userId: user._id,
                    token: token
                })
                let id = newToken._id.toString();
                newToken.save()
                console.log(process.env.DOMAIN, token, id)
                await mail(
                  "Password reset link",
                  `<b>Use This link to reset your password</b>
                  <a
                  href="https://${process.env.DOMAIN}/auth/forgetPassword?token=${token}&id=${id}">https://${process.env.DOMAIN}/auth/forgetPassword?token=${token}&id=${id}</a>`,
                  email
                ).then(() => {
                  res.status(200).json({
                    msg: "An Email containing code has been sent to your account. Please check spam incase if you dont recieve one",
                  });
                });
              }
            });
        }
    } catch (error) {
        console.log(error)
    }
}

const verifyLink = async(req, res) => {
    try {
        let { token, id } = req.query;
        if(req.method == "GET"){
            await tokenModel.findById(id).then(async (code) => {
              if (code != null) {
                let decodedToken = jwt.decode(code.token, SALT);
                let obj = jwt.decode(token, SALT);
                if (
                  decodedToken.code === obj.code &&
                  decodedToken.email === obj.email
                ) {
                  res.render("updatePass.ejs", { email: obj.email });
                }
              } else {
                res.render("400.ejs", { t: 404, sub: "Not valid code" });
              }
            });
        }else if(req.method == "POST"){
            let password = req.body.password;
            console.log(password)
            let email = jwt.decode(req.headers.token, SALT).email;
            await userModel.findOne({email: email}).then(async(user) => {
                if(user != null){
                    user.password = password;
                    user.save().then(() => {
                        res.status(200).json({"msg": "password updated"})
                    })
                }
            })
        }
    } catch (error) {
        console.log(error)
    }
}


module.exports = { login, register, checkMail, verifyLink };
