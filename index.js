const express  = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const cloudinary = require("cloudinary").v2
const carRoutes = require("./routes/cars.js");
const bookingRouter = require("./routes/booking");
const adminRoutes = require("./routes/admin");
const carModel = require("./models/carModel.js");
const adminAuth = require("./middlewares/adminauth");
const { autoDelete } = require("./controllers/booking");
const sessionModel = require("./models/sessionModel");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const DB_URI = process.env.DB;
const app = express();

//oiQXsUlU6TV4agCR
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

app.use(cors())
app.use(express.urlencoded({limit: '50mb', extended: false }));
app.use(express.json({ limit: "50mb" }));
app.use("/static", express.static(path.join(__dirname, "static")));

app.use("/auth", authRoutes)
app.use("/admin", carRoutes)
app.use("/adminpanel", adminRoutes);
app.use("/booking", bookingRouter)
app.use("/terms&conditions", (req, res) => res.render("terms.ejs"));


function remDups(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
} 

app.get("/", async(req, res) => {
  try {
    await carModel.find().then(cars => {
      if(cars.length > 0){
        let locations = cars
          .filter(
            (car) => car.place?.toLowerCase() === "Vizag".toLowerCase()
          )
          .map((car) => {
            return car.location?.toLowerCase();
          });
        let places = cars.map((car) => {
          return car.place?.toLowerCase();
        });
        locations.push("Any")
        res.render("index.ejs", { locations: remDups(locations), places: remDups(places)});
      }else{
        res.render("index.ejs", {locations: "pm palem"});
      }
    })
  } catch (error) {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
})

app.get("/locations/:place", async(req, res) => {
  try {
    let cars = await carModel.find({place: req.params.place});
    if(cars.length <= 0){ 
      const locations = ["No cars found"]
      res.status(400).json({ locs: locations });
    }else{
      const locations = remDups(
        cars.map((car) => {
          return car.location?.toLowerCase();
        })
      );
      res.status(200).json({"locs": locations})
    }
  } catch (error) {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
})

app.post("/cars", async(req, res) => {
    try {
      const data = req.body;
      let cars = await carModel.find({ place: data.place.toLowerCase() });
      const locations = remDups(
        cars.map((car) => {
          return car.location?.toLowerCase();
        })
      );
      res.render("cars.ejs", {
        locations: locations,
        service: data.service,
        city: data.place.toLowerCase(),
      });
    } catch (error) {
        console.log(error)
        res.render("400.ejs", { t: 500, sub: "Something went wronggg" });
    }
});

app.get("/adminlogin", (req, res) => {
  res.render("adminlogin.ejs")
})


app.use((req, res, next) => {
  res.render("400.ejs", {t:404, sub: "Not Found"})
})

//run daily funcs

mongoose.connect(DB_URI).then(() => {
    console.log("DB connected")
    // autoDelete();
    app.listen(PORT, () => {
      console.log("server started");
      console.log(`http://localhost:${PORT}/`)
    });
})
