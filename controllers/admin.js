const userModel = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");

async function handleUpload(req, res) {
  let file = req.body.file;
  let id = req.params.id;
  let head = req.body.head
  let user = await userModel.findById(id)
  if(user != null){
    if (file != null) {
      const respImg = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      switch (head) {
        case "aadhaar":
          user.aadhaar = respImg.secure_url;
          break;
        case "license":
          user.license = respImg.secure_url;
          break;
        case "idproof":
          user.idproof.proof = respImg.secure_url;
          break;
        default:
          break;
      }
      user.save();
      res.status(200).json({ "msg": "Image saved" });
    } else {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
  }
}

const getUsers = async(req, res) => {
  try {
    await userModel.find().then((users) => {
      if(users.length > 0){
        users.forEach((user) => user.password = "")
        res.status(200).json({"data": users})
      }
    })
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

const updateRole = async (req, res) => {
  try {
    let id = req.params.id
    await userModel
      .findByIdAndUpdate(id, {
        role: req.body.role,
        idproof: {
          userType: req.body.idproof
        },
        kycStatus: req.body.kycStatus || false,
      })
      .then((user) => {
        console.log(user);
        res.status(200).json({ msg: "User Updated" });
      });
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
  }
};

const deleteUser = async(req, res) => {
  try {
    let id = req.params.id;
    await userModel.findByIdAndDelete(id).then(() => {
      res.status(200).json({"msg": "User deleted"})
    })
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

function remDups(array) {
  return [...new Set(array)];
}

const executive_data = async (req, res) => {
  try {
    const users = await userModel.find({ role: "Executive" });
    const allCars = await carModel.find();
    const data = [];

    if (users.length > 0) {
      await Promise.all(
        users.map(async (user) => {
          const obj = {};
          obj.username = user.username;
          let cars = {};
          allCars.forEach((car) => {
            if (car && car.brand) {
              cars[car.brand] = 0;
            }
          });

          const bookings = await bookingModel.find({ userId: user.email });
          let validBookingsCount = 0;

          await Promise.all(
            bookings.map(async (booking) => {
              try {
                const car = await carModel.findById(booking.carId);
                if (car && car.brand) {
                  cars[car.brand] = (cars[car.brand] || 0) + 1;
                  validBookingsCount++;
                } else {
                  console.log(
                    `Skipping count for booking ID: ${booking._id}, Car ID: ${booking.carId} - Car not found or missing brand`
                  );
                }
              } catch (error) {
                console.error(
                  `Error processing booking ID: ${booking._id}, Car ID: ${booking.carId}:`,
                  error
                );
              }
            })
          );

          obj.bookingcount = validBookingsCount;
          obj.cars = Object.keys(cars).map((brand) => ({
            carname: brand,
            count: cars[brand],
          }));
          data.push(obj);
        })
      );

      console.log(data);
      res.status(200).json({ data: data });
    } else {
      res.status(404).json({ message: "No executive users found" });
    }
  } catch (error) {
    console.error("Error in executive_data:", error);
    res
      .status(500)
      .json({ error: "Something went wrong", details: error.message });
  }
};



module.exports = { getUsers, updateRole, deleteUser, handleUpload, executive_data };