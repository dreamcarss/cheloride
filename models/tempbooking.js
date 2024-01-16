const mongoose = require("mongoose")

const tempBookingSchema = mongoose.Schema({
  data: { type: Array, require: true },
  carId: { type: String, require: true },
  userId: { type: String, require: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  }
});

const tempBooking = mongoose.model("tempBookings", tempBookingSchema);
module.exports = tempBooking