const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SALT = process.env.SALT;

const execAuth = async(req, res, next) => {
    try {

        const email = jwt.decode(req.headers.token, SALT);
        await userModel.findOne({email}).then((user) => {
            if(user != null && user?.role === "Executive" || user?.role === "Admin"){
                console.log(user.role, "hi")
                next();
            }else{
                res.status(403).json({ msg: "/auth/login" });
            }
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = execAuth;
