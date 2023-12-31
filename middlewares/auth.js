const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const SALT = process.env.SALT;

const authMiddleware = async(req, res, next) => {
  try {
    const token = req.headers.token;
    const email = jwt.decode(token);
    await userModel.findOne({email: email}).then(user => {
        if(user!= null){
            req.body.email = email;
            req.body.id = user._id;
            req.body.phone = user.phone
            next();
        }else{
            res.render("login.ejs")
        }
    })
  } catch (error) {
    console.log(error);
  }
};

module.exports = authMiddleware;
