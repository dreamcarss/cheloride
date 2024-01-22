const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema({
  city: { type: Array, require: true },
  service: { type: Array, require: true },
  loc: { type: Array, require: true },
  date: { type: String, require: true },
  time: { type: String, require: true },
  ddate: { type: String, require: true },
  dtime: { type: String, require: true },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: "5m" },
  },
});

const sessionModel = mongoose.model("sessionData", sessionSchema);
module.exports = sessionModel;
