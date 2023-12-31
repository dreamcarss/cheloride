const mongoose = require("mongoose");


const bookingSchema = mongoose.Schema({
  userId: { type: String, require: true },
  carId: { type: String, require: true },
  time: { type: String, require: true },
  price: { type: Number, require: true },
  paymentStatus: { type: String, default: "unpaid" },
  startDate: { type: String, require: true },
  dropDate: { type: String, require: true },
});


const bookingModel = mongoose.model("bookings", bookingSchema);
module.exports = bookingModel;
