const express = require("express");
const {
  createCars,
  getALlCars,
  getALlCarsAdmin,
  getCar,
  deleteCar,
  updateCar,
  handleUpload,
} = require("../controllers/cars");
const adminAuth = require("../middlewares/adminauth");
const authMiddleware = require("../middlewares/auth.js");
const execAuth = require("../middlewares/execAuth");

const carRoutes = express.Router();

carRoutes.post("/uploadCar", authMiddleware, execAuth, createCars);
carRoutes.get("/allCars",  getALlCars);
carRoutes.delete("/delete/:id", authMiddleware, adminAuth, deleteCar);
carRoutes.get("/allCarsAdmin", authMiddleware, execAuth, getALlCarsAdmin);
carRoutes.get("/getCar/:id", getCar);
carRoutes.patch("/updateCar/:id", authMiddleware, execAuth, adminAuth, updateCar);
carRoutes.patch("/updateImg/:id", authMiddleware, adminAuth, handleUpload);

module.exports = carRoutes;