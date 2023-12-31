const mongoose = require("mongoose")

const tempBookingSchema = mongoose.Schema({
  data: { type: Array, require: true },
  carId: { type: String, require: true },
  userId: { type: String, require: true }
});

const tempBooking = mongoose.model("tempBookings", tempBookingSchema);
module.exports = tempBooking