const carModel = require("../models/carModel.js");
const cloudinary = require("cloudinary")

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
        await carModel.find({carStatus: false}).then((cars) => {
            if(cars.length>0){
                res.status(200).json({"cars":cars})
            }else{
                res.json({"msg":"No cars found"})
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
    await carModel.findByIdAndDelete(id).then(() => {
      res.status(200).json({"msg": "Car Deleted"})
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createCars, getALlCars, getCar, getALlCarsAdmin, deleteCar };