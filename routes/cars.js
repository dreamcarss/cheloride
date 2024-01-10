const express = require("express");
const {
  createCars,
  getALlCars,
  getALlCarsAdmin,
  getCar,
  deleteCar,
  updateCar,
} = require("../controllers/cars");
const adminAuth = require("../middlewares/adminauth");
const authMiddleware = require("../middlewares/auth.js");
const execAuth = require("../middlewares/execAuth");

const carRoutes = express.Router();

carRoutes.post("/uploadCar", authMiddleware, adminAuth, createCars);
carRoutes.get("/allCars",  getALlCars);
carRoutes.delete("/delete/:id", authMiddleware, adminAuth, deleteCar);
carRoutes.get("/allCarsAdmin", authMiddleware, execAuth, getALlCarsAdmin);
carRoutes.get("/getCar/:id", getCar);
carRoutes.patch("/updateCar/:id", authMiddleware, adminAuth, updateCar)

module.exports = carRoutes;