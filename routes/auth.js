const authFuncs = require("../controllers/auth.js");
const express = require("express");
const { upload } = require("../index.cjs");
const authRoutes = express.Router();


authRoutes.get("/register", authFuncs.register);
authRoutes.post("/register", authFuncs.register);


authRoutes.get("/login", authFuncs.login);
authRoutes.post("/login", authFuncs.login);


module.exports = authRoutes;