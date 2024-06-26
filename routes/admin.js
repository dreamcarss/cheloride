const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken")
const authMiddleware = require("../middlewares/auth");
const { getTrash, restoreTrashCar } = require("../controllers/trash");
const adminAuth = require("../middlewares/adminauth");
const { getUsers, updateRole, deleteUser, handleUpload, executive_data } = require("../controllers/admin");
const execAuth = require("../middlewares/execAuth");
require("dotenv").config();

const adminRoutes = require("express").Router()
const SALT = process.env.SALT

adminRoutes.get("/", (req, res) => {
    res.render("admin.ejs");
})

adminRoutes.post("/monitor" , authMiddleware, execAuth, (req, res) => {
    console.log(req.body.Authorization);
    res.render("adminMqtt.ejs");
})

adminRoutes.get("/bookings", (req, res) => {
  res.render("adminBookings.ejs");
});

adminRoutes.get("/users", (req, res) => res.render("users.ejs"));
adminRoutes.get("/getUsers", authMiddleware, execAuth, getUsers);
adminRoutes.patch("/uploadImage/:id", authMiddleware, execAuth, handleUpload);
adminRoutes.patch("/updateRole/:id", authMiddleware, adminAuth, updateRole);
adminRoutes.delete("/deleteUser/:id", authMiddleware, adminAuth, deleteUser);
adminRoutes.get("/executives/data", authMiddleware, adminAuth, executive_data);
adminRoutes.get("/executives", (req, res) => {res.render("execList.ejs")});


adminRoutes.get("/checkAdmin", authMiddleware, async(req, res) => {
  try {
    const email = req.body.email;
    await userModel.findOne({email:email}).then(async(user) => {
      if(user != null && user.role === "Admin" || user.role === "Executive"){
        res.status(200).json({"url":"/adminpanel"})
      }else{
        console.log("user")
      }
    })
  } catch (error) {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
})


adminRoutes.get("/trash", (req, res) => res.render("trash.ejs"));
adminRoutes.get("/trashData", authMiddleware, execAuth, getTrash);
adminRoutes.post("/restoreTrash", authMiddleware, execAuth, restoreTrashCar);

module.exports = adminRoutes;