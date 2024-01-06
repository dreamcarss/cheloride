const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

userSchema.pre('save', function(next){
  if(!this.isModified('password')){
    return next()
  }
  bcryptjs.hash(this.password, 10, (err, hash) => {
    if(err){
      console.log(err)
      return next()
    }
    this.password = hash;
    next();
  })
})

userSchema.methods.genToken = function(){
  const token = jwt.sign(this.email, process.env.SALT)
  return token
}

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;