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


function remDups(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
} 

app.get("/", async(req, res) => {
  try {
    await carModel.find().then(cars => {
      if(cars.length > 0){
        let locations = cars.map((car) => {return car.location.toLowerCase()})
        locations.push("Any")
        res.render("index.ejs", { locations: remDups(locations)});
      }else{
        res.render("index.ejs", {locations: "pm palem"});
      }
    })
  } catch (error) {
    console.log(error);
  }
})

app.use("/cars", async(req, res) => {
  if(req.method == "GET"){
    const sid = req.query.sid;
    console.log(sid);
    if(sid === null){
      res.render("index.js")
    }else{
      const sessionData = await sessionModel.findById(sid);
      if (sessionData != null) {
        res.render("cars.ejs", {
          location: sessionData.loc,
          date: sessionData.date,
          time: sessionData.time,
          ddate: sessionData.ddate,
          dtime: sessionData.dtime,
        });
      }
    }
  }else{
    try {
      const data = req.body;
      console.log(data.dtime);
      res.render("cars.ejs", {
        location: data.location,
        date: data.date,
        time: data.time,
        ddate: data.ddate,
        dtime: data.dtime,
      });
    } catch (error) {
      console.log(error);
    }
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
    autoDelete();
    app.listen(PORT, () => {
      console.log("server started");
      console.log(`http://localhost:${PORT}/`)
    });
})

