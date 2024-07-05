const mongoose = require("mongoose")

const tempBookingSchema = mongoose.Schema({
  date: { type: Object, require: true },
  ddate: { type: Object, require: true },
  time: { type: Object, require: true },
  dtime: { type: Object, require: true },
  location: { type: Object, require: true },
  carId: { type: String, require: true },
  service: { type: String, default: "Self" },
  userId: { type: String, require: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
});

const tempBooking = mongoose.model("tempBookings", tempBookingSchema);
module.exports = tempBooking