const userModel = require("../models/userModel");

const adminRoutes = require("express").Router()


adminRoutes.get("/", (req, res) => {
    res.render("admin.ejs");
})

adminRoutes.get("/bookings", (req, res) => {
  res.render("adminBookings.ejs");
});

adminRoutes.get("/users", async(req, res) => {
  try {
    await userModel.find().then((users) => {
      if(users.length > 0){
        res.render("users.ejs", {users: users});
      }
    })
  } catch (error) {
    console.log(error)
  }
});

module.exports = adminRoutes;