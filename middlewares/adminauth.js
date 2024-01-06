const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SALT = process.env.SALT;

const adminAuth = async(req, res, next) => {
    try {

        const email = jwt.decode(req.headers.token, SALT);
        await userModel.findOne({email}).then((user) => {
            if(user != null && user?.role === "admin"){
                console.log(user.role)
                next();
            }else{
                res.status(403).json({ msg: "/auth/login" });
                // res.status(403).json({"msg": "Not authorised"})
            }
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = adminAuth;
