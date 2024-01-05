const carModel = require("../models/carModel.js");
const trashModel = require("../models/trashbin");
const cloudinary = require("cloudinary");
const bookingModel = require("../models/booking.js");

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res.secure_url;
}

const createCars = async(req, res) => {
    try {
        const body = req?.body;
        const newCar = new carModel({
          brand: body.brand,
          image: await handleUpload(body.image),
          desc: body.desc,
          geartype: body.gear,
          fuelcap: body.fuel,
          fueltype: body.fueltype,
          seating: body.seating,
          location: body.location,
          luggage: body.luggage,
          amount: body.amount,
          mileage: body.mileage,
          location: body.location,
        });
        await newCar.save().then(() => {
            res.status(200).json({"msg": "saved"})
        })
    } catch (error) {
        console.log(error);
    }
}


const getALlCars = async(req, res) => {
    try {
      let sDate = new Date(req.headers.startdate);
      let dDate = new Date(req.headers.enddate);
      let carsList = [];
      let loc = req.headers.loc;
      console.log(req.headers.loc)
      let cars = await carModel.find()
      let promises = cars.map(async (car) => {
        await bookingModel.findOne({ carId: car._id, bookingStatus:true}).then((booking) => {
          if (booking != null) {
            let startDate = new Date(booking.startDate);
            let endDate = new Date(booking.dropDate);
            if (
              (sDate >= startDate && sDate < endDate) ||
              (dDate > startDate && dDate <= endDate)
            ) {
              null;
            } else {
              carsList.push(car);
            }
          } else {
            carsList.push(car);
          }
        });
      });
      Promise.all(promises).then(() => {
        if(carsList.length > 0){
          console.log(carsList)
          res.status(200).json({"cars": carsList})
        }else{
          res.status(404).json({"msg": "no cars available"})
        }
      })
    } catch (error) {
        console.log(error)
    }
}


const getALlCarsAdmin = async (req, res) => {
  try {
    await carModel.find().then((cars) => {
      if (cars.length > 0) {
        res.status(200).json({ cars: cars });
      } else {
        res.json({ msg: "No cars found" });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const getCar = async (req, res) => {
  try {
    const id = req.params.id;
    await carModel.findById(id).then((car) => {
      if (car != undefined) {
        res.status(200).json(car);
      } else {
        res.json({ msg: "No cars found" });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteCar = async(req, res) => {
  try {
    const id = req.params.id;
    console.log(id)
    await carModel.findById(id).then((car) => {
      if (car != null) {
        let trash = new trashModel({
          trash: car,
        });
        trash.save().then(async() => {
          await carModel.findByIdAndDelete(id).then(() => {
            res.status(200).json({ msg: "Car Deleted Successfully" });
          })
        });
      }
    });
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createCars, getALlCars, getCar, getALlCarsAdmin, deleteCar };
