const carModel = require("../models/carModel.js");
const trashModel = require("../models/trashbin");
const cloudinary = require("cloudinary");
const bookingModel = require("../models/booking.js");
const userModel = require("../models/userModel.js");

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res.secure_url;
}

const createCars = async(req, res) => {
    try {
        const body = req?.body;
        console.log(body.place)
        const newCar = new carModel({
          brand: body.brand,
          image: await handleUpload(body.image),
          desc: body.desc,
          geartype: body.gear,
          fuelcap: body.fuel,
          fueltype: body.fueltype,
          seating: body.seating,
          location: body.location.toLowerCase(),
          place: body.place.toLowerCase(),
          luggage: body.luggage,
          amount: body.amount,
          mileage: body.mileage,
          location: body.location,
        });
        await newCar.save().then(() => {
          console.log(newCar)
            res.status(200).json({msg: "saved"})
        })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
    }
}


const getALlCars = async (req, res) => {
  try {
    let sDate = new Date(req.headers.startdate);
    let dDate = new Date(req.headers.enddate);
    let dtime = req.headers.time;
    let carsList = [];
    let loc = req.headers.loc;
    console.log(req.headers.city)
    let cars = await carModel.find({place: req.headers.city});
    let diff;
    let promises = cars.map(async (car) => {
      diff = Math.abs(dDate - sDate) / 8.64e7;
      await bookingModel
        .findOne({ carId: car._id, bookingStatus: true })
        .then((booking) => {
          if (booking != null) {
            let startDate = new Date(booking.startDate);
            let endDate = new Date(booking.dropDate);
            console.log(diff)
            if (
              (sDate >= startDate && sDate <= endDate) ||
              (dDate > startDate && dDate <= endDate)
              ) {
              let stDate = new Date(sDate).toISOString().split("T")[0];
              let dropDate = new Date(endDate).toISOString().split("T")[0];
              console.log(startDate, endDate, stDate, dropDate)
              if (stDate == dropDate) {
                console.log("ji");
                let timeDiff = Math.round(
                  (
                    new Date(`${stDate} ${dtime}`) -
                      new Date(`${stDate} ${booking.dtime}`)
                  ) / 3600000
                );
                console.log(timeDiff)
                if(timeDiff <= 0){
                  let carObj = { ...car }._doc;
                  carObj.timeLeft = timeDiff;
                  carsList.push(car);
                }else{
                  carsList.push(car)
                }
              }
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
      if (carsList.length > 0) {
        res.status(200).json({ cars: carsList, diff: diff });
      } else {
        res.status(404).json({ msg: "no cars available" });
      }
    });
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
  }
};


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
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
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
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
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
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

const updateCar = async(req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    await userModel.findByIdAndUpdate(id, {
      brand: body.brand,
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
    }).then(() => {
      res.status(200).json({"msg": "Car Updated"})
    });
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

module.exports = { createCars, getALlCars, updateCar, getCar, getALlCarsAdmin, deleteCar };
