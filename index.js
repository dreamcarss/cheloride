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
const userModel = require("./models/userModel");
const authMiddleware = require("./middlewares/auth");
const crypto = require('crypto')
require("dotenv").config();
const stringify = require("json-stringify-safe");

const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require("sha256");
const tempBooking = require("./models/tempbooking");

const MERCHANT_ID = process.env.MERCHANTID;
const SALT_INDEX = process.env.SALT_INDEX;
const SALT_KEY = process.env.SALT_KEY;
const PHONEPE_API_BASE_URL = process.env.URI;


const PORT = process.env.PORT || 4000;
const DB_URI = process.env.DB;
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

app.use(cors())
app.use(express.urlencoded({limit: '50mb', extended: false }));
app.use(express.json({ limit: "50mb" }));
app.use(
  "/static",
  express.static(path.join(__dirname, "static"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

app.use("/auth", authRoutes)
app.use("/admin", carRoutes)
app.use("/adminpanel", adminRoutes);
app.use("/booking", bookingRouter)
app.use("/terms&conditions", (req, res) => res.render("terms.ejs"));
app.use("/privacyPolicy", (req, res) => res.render("privacypolicy.ejs"));
app.get("/join-us", (req, res) => res.render("join.ejs"));
app.post("/join-request", async(req, res) => {
  const email = req.body.email;
  await mail("New Vendor Join Request", `<b>${email}</b>`, process.env.MAIL)
  await mail(
    "Request regarding joining CheloRide community",
    `<!DOCTYPE html>
      <html>
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
              <h1>CheloRide</h1>
            </div>
            <div class="content">
              <h1>Hi,</h1>
              <p>Thank you for your interest in joining CheloRide, the car rental community for car lovers. We are thrilled to have you on board!</p>
              <p>CheloRide is a platform where you can share your car with other car enthusiasts and earn money while you do it. You can also rent a car from our community and enjoy the thrill of driving your dream car.</p>
              <p>Happy driving,</p>
              <p>The CheloRide Team</p>
            </div>
            <div class="footer">
              <p>&copy; CheloRide</p>
            </div>
          </div>
        </body>
      </html>
    `,
    email
  );
  res.status(200).render("400.ejs", { t: "Join Request", sub: "Join request has been sent, Our executive will contact you shortly mean whil you can check our cars and services" });
})

app.post("/taxi", authMiddleware, async (req, res) => {
  const email = req.body.email;
  const time = req.body.time;
  const location = req.body.location;
  const user = await userModel.findOne({email});
  if(user != null){
    await mail(
      "New Taxi Booking",
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
                <h1>Email: ${email},</h1>
                <p>Phone: ${user.phone}</p>
                <p>Time: ${time}</p>
                <p>Location: ${location}</p>
              </div>
            </div>
          </body>
          </html>
      `,
      process.env.MAIL
    );
    res
      .status(200)
      .json({
        msg: "Taxi Booked! Your taxi will arrive shortly.",
      });
  }
});


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
      console.log(cars);
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
});

app.get("/quickbooking", (req, res) => {
  res.render("quickbooking.ejs")
})



app.post("/quickbook", async(req, res) => {
  const {name, phone} = req.body;
  try {
    if(name != null || phone != null){
      await mail(
        "Request for QUICK BOOKING",
        `<b>Name : ${name}</b> <br/> <b> Phone : ${phone}</b>`,
        process.env.MAIL
      );
      res.render("400.ejs", { t: "Quick booking", sub: `Hi ${name}, Request sent successfully, our executive will contact you within few minutes. Thankyou!` });
    }else{
      console.log(name, phone)
      res.render("400.ejs", { t: 400, sub: "Invalid Details" });
    }
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wronggg" });
  }
})


const interval = 24 * 60 * 60 * 1000;
setInterval(autoDelete, interval);

// app.use("/", (req, res) => {
//   res.render(
//     "maintanance.ejs"
//   );
// })

app.get("/taxiservices", (req, res) => {
  res.render("taxi.ejs")
})

app.use("/feePolicy", (req, res) => res.render("cancelPolicy.ejs"));


app.get("/pay", async (req, res) => {
  try {
    const transactionId = "MT-" + uniqid();
    console.log(req.headers.tempid);
    const booking = await tempBooking.findById(req.headers.tempid);
    console.log(booking)
    if (booking != null) {
      const car = await carModel.findById(booking.carId);
      const stDt = new Date(
        booking.date + "T" + booking.time + "Z"
      );
      const edDt = new Date(
        booking.ddate + "T" + booking.dtime + "Z"
      );
      let diff = Math.abs(edDt - stDt);
      let data = {};
      let hrs = diff / 3.6e6;
      let hrlyCharges = parseInt(car.amount) / 24;
      let totalAmount = Math.round(hrlyCharges * hrs);
      let gst = Math.round(parseFloat(process.env.GST) * totalAmount);
      console.log(totalAmount + gst);
      const payload = {
        paymentInstrument: {
          type: "PAY_PAGE",
        },
        merchantId: MERCHANT_ID,
        merchantTransactionId: transactionId,
        merchantUserId: "MUID" + uniqid(),
        amount: Math.floor((totalAmount + gst) * 100),
        redirectUrl: `https://www.cheloride.com/status/${transactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: `https://www.cheloride.com/status/${transactionId}`,
        mobileNumber: "9999999999",
      };

      let dataPayload = JSON.stringify(payload);
      const base64Enc = Buffer.from(dataPayload, "utf-8").toString("base64");
      const fullUrl = base64Enc + "/pg/v1/pay" + SALT_KEY;
      const dataSha = sha256(fullUrl);
      const checksum = dataSha + "###" + SALT_INDEX;

      const URI_PAY = `${PHONEPE_API_BASE_URL}/pg/v1/pay`;

      console.log("payload - " + dataPayload);
      console.log("base-64-enc - " + base64Enc);
      console.log("sha256 - " + dataSha);
      console.log("x-verify - " + checksum);

      const response = await axios.post(
        URI_PAY,
        {
          request: base64Enc,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          },
        }
      );

      const tokenUrl = response.data.data.instrumentResponse.redirectInfo.url;
      console.log(tokenUrl);
      res.json({ tokenUrl });
    }else{
      console.log("no booking")
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

app.get("/redirect-url/:id", (req, res) => {
  const id = req.params.id; 
  
});

app.use((req, res, next) => {
  res.render("400.ejs", { t: 404, sub: "Not Found" });
});


mongoose.connect(DB_URI).then(() => {
    console.log("DB connected")
    app.listen(PORT, () => {
      console.log("server started");
      console.log(`http://localhost:${PORT}/`)
    });
})

