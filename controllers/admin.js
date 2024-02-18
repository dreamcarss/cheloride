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
      try {
        await Promise.all(
          users.map(async (user) => {
            const obj = {};
            obj.username = user.username;
            let cars = {};
            allCars.forEach((car) => {
              cars[car.brand] = 0; // Initialize all car counts to 0
            });
            const bookings = await bookingModel.find({ userId: user.email });
            obj.bookingcount = bookings.length;
            await Promise.all(
              bookings.map(async (booking) => {
                const car = await carModel.findById(booking.carId);
                cars[car.brand] = (cars[car.brand] || 0) + 1;
              })
            );
            obj.cars = Object.keys(cars).map((brand) => ({
              carname: brand,
              count: cars[brand],
            }));
            data.push(obj);
          })
        );
        res.status(200).json({"data": data})
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
};




module.exports = { getUsers, updateRole, deleteUser, handleUpload, executive_data };