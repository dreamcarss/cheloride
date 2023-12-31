const mongoose = require("mongoose");

const carSchema = mongoose.Schema({
  brand: { type: String, required: true },
  image: { type: String, required: true },
  desc: { type: String, required: true },
  amount: { type: String, required: true },
  geartype: { type: String, required: true },
  fuelcap: { type: String, required: true },
  seating: { type: String, required: true },
  location: { type: String, required: true },
  luggage: { type: String, required: true },
  mileage: { type: String, required: true },
  carStatus: { type: Boolean, default: false },
});

const carModel = mongoose.model("cars", carSchema)
module.exports = carModel;