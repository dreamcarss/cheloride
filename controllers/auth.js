const userModel = require("../models/userModel.js")
const bcryptjs = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken")
const fs = require("fs")

const SALT = process.env.SALT;

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res.secure_url;
}

const register = async(req, res) => {
    try {
        const request = req;
        if(request.method === "GET"){
            res.render("register.ejs");
        }else if(request.method === "POST"){
            const body = request?.body;
            userModel.findOne({email: body.email}).then(async(user) => {
                if(user == null){
                    const hash = await bcryptjs.hash(body.password, 10);
                    let newUser = new userModel({
                      username: body.name,
                      email: body.email,
                      phone: parseInt(body.phone),
                      password: hash,
                      role: "user",
                      aadhaar: await handleUpload(body.aadhaar),
                      idproof: {
                        userType: "student",
                        proof: await handleUpload(body.id),
                      },
                      license: await handleUpload(body.license),
                    });
                    await newUser.save().then(() => {
                        let token = jwt.sign(body.email, SALT)
                        res.json({"msg": "user saved", "token": token})
                    })
                }else{
                    res.status(400).json({"msg": "user exists"})
                }
            })

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

module.exports = {login, register}
