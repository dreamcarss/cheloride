const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SALT = process.env.SALT;

const adminAuth = async(req, res, next) => {
    try {

        const email = jwt.decode(req.headers.token, SALT);
        await userModel.findOne({email}).then((user) => {
            if(user != null && user?.role === "Admin"){
                console.log(user.role)
                next();
            }else{
                res.status(403).json({ msg: "/auth/login" });
            }
        })
    } catch (error) {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}

module.exports = adminAuth;
