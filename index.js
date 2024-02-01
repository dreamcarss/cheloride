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
const mail = require("./utils/mailer");
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
app.get("/join-us", (req, res) => res.render("join.ejs"));
app.post("/join-request", async(req, res) => {
  const email = req.body.email;
  await mail("New Join Request", `<b>${email}</b>`, process.env.MAIL)
  await mail(
    "Request regarding joining CheloRide community",
    `<html>
        <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #cccccc;
          }
          .header {
            padding: 20px;
            text-align: center;
            background-color: #f0f0f0;
          }
          .header img {
            width: 200px;
            height: auto;
          }
          .content {
            padding: 20px;
          }
          .content h1 {
            font-size: 24px;
            font-weight: bold;
            color: #000000;
            margin: 0 0 10px 0;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 10px 0;
          }
          .content ul {
            list-style-type: disc;
            margin: 0 0 10px 20px;
            padding: 0;
          }
          .content ul li {
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 5px 0;
          }
          .content a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #00a0e9;
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
            border-radius: 5px;
          }
          .footer {
            padding: 20px;
            text-align: center;
            background-color: #f0f0f0;
          }
          .footer p {
            font-size: 12px;
            color: #999999;
            margin: 0;
          }
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="logo.png" alt="CheloRide Logo">
            </div>
            <div class="content">
              <h1>Hi ${email},</h1>
              <p>Thank you for your interest in joining CheloRide, the car rental community for car lovers. We are thrilled to have you on board!</p>
              <p>CheloRide is a platform where you can share your car with other car enthusiasts and earn money while you do it. You can also rent a car from our community and enjoy the thrill of driving your dream car.</p>
              <p>As a member of CheloRide, you will be able to:</p>
              <ul>
                <li>List your car for rent and set your own price and availability</li>
                <li>Browse and book from a variety of cars, from classic to exotic, at affordable rates</li>
              </ul>
              <p>If you have any questions or need any help, please feel free to contact us at ${process.env.MAIL}. We are always happy to assist you.</p>
              <p>We look forward to seeing you on CheloRide soon!</p>
              <p>Happy driving,</p>
              <p>The CheloRide Team</p>
            </div>
          </div>
        </body>
        </html>
    `,
    email
  )
  res.status(200).render("400.ejs", { t: "Join Request", sub: "Join request has been sent, Our executive will contact you shortly mean whil you can check our cars and services" });
})


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

