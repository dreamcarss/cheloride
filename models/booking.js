const mongoose = require("mongoose");


const bookingSchema = mongoose.Schema({
  userId: { type: String, require: true },
  carId: { type: String, require: true },
  service: { type: String, default: "Self" },
  time: { type: String, require: true },
  dtime: { type: String, require: true },
  price: { type: Number, require: true },
  paymentStatus: { type: String, default: "paid" },
  startDate: { type: String, require: true },
  dropDate: { type: String, require: true },
  bookingStatus: { type: Boolean, default: true },
  transactionID: { type: String, default: "offline" },
});


const bookingModel = mongoose.model("bookings", bookingSchema);
module.exports = bookingModel;
