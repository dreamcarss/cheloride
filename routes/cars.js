const express = require("express");
const {
  createCars,
  getALlCars,
  getALlCarsAdmin,
  getCar,
  deleteCar,
} = require("../controllers/cars");
const adminAuth = require("../middlewares/adminauth");
const authMiddleware = require("../middlewares/auth.js")

const carRoutes = express.Router();

carRoutes.post("/uploadCar", authMiddleware, adminAuth, createCars);
carRoutes.get("/allCars",  getALlCars);
carRoutes.delete("/delete/:id", authMiddleware, adminAuth, deleteCar);
carRoutes.get("/allCarsAdmin", authMiddleware, adminAuth, getALlCarsAdmin);
carRoutes.get("/getCar/:id", getCar);

module.exports = carRoutes;