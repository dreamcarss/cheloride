const jwt = require("jsonwebtoken");
const sessionModel = require("../models/sessionModel");
const userModel = require("../models/userModel");
require("dotenv").config();

const SALT = process.env.SALT;

const authMiddleware = async(req, res, next) => {
  try {
    const token = req.headers?.token;
    let status = req.body;
    const email = jwt.decode(token);
    if (email != null) {
      await userModel.findOne({ email: email }).then(async (user) => {
        req.body.email = email;
        req.body.id = user._id;
        req.body.phone = user.phone;
        next();
      });
    } else {
      res.status(400).json({ msg: "not found"});
    }
  } catch (error) {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
};

module.exports = authMiddleware;
