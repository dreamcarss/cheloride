const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  aadhaar: { type: String, required: true },
  idproof: {
    userType: { type: String, required: true },
    proof: { type: String, required: true },
  },
  license: { type: String, required: true },
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;