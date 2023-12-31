const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const SALT = "AJSDBFJBHAD3@$SDJNF243Rsdcf$#tesfs";

const adminAuth = async(req, res, next) => {
    try {

        const email = jwt.decode(req.headers.token, SALT);
        await userModel.findOne({email}).then((user) => {
            if(user != null && user?.role === "admin"){
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