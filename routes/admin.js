const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken")
const authMiddleware = require("../middlewares/auth");
const { getTrash, restoreTrashCar } = require("../controllers/trash");
const adminAuth = require("../middlewares/adminauth");
require("dotenv").config();

const adminRoutes = require("express").Router()
const SALT = process.env.SALT

adminRoutes.get("/", (req, res) => {
    res.render("admin.ejs");
})

adminRoutes.get("/bookings", (req, res) => {
  res.render("adminBookings.ejs");
});

// adminRoutes.get("/users", async(req, res) => {
//   try {
//     await userModel.find().then((users) => {
//       if(users.length > 0){
//         res.render("users.ejs", {users: users});
//       }
//     })
//   } catch (error) {
//     console.log(error)
//   }
// });

adminRoutes.get("/checkAdmin", authMiddleware, async(req, res) => {
  try {
    const email = req.body.email;
    await userModel.findOne({email:email}).then(async(user) => {
      if(user != null && user.role === "admin"){
        res.status(200).json({"url":"/adminpanel"})
      }else{
        console.log("user")
      }
    })
  } catch (error) {
    console.log(error)
  }
})


adminRoutes.get("/trash", (req, res) => res.render("trash.ejs"));
adminRoutes.get("/trashData", authMiddleware, adminAuth, getTrash);
adminRoutes.post("/restoreTrash", authMiddleware, adminAuth, restoreTrashCar);

module.exports = adminRoutes;