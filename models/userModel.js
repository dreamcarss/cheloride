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
  kycStatus: {type: Boolean, default: false},
  aadhaar: { type: String, },
  idproof: {
    userType: { type: String, },
    proof: { type: String, },
  },
  license: { type: String, },
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