const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");
const tempBooking = require("../models/tempbooking");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken")
const mail = require("../utils/mailer");
require("dotenv").config();
const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require("sha256")


const MERCHANTID = "M22Z0RAGALB6X";
const SALT_INDEX = 1;
const SALT_KEY = "12f15971-0f45-4b63-89e9-65a6304b886d";
const URI = " https://api-preprod.phonepe.com/apis/pg-sandbox";

const getAllBookings = async(req, res) => {
    try {
        await bookingModel.find().then(bookings => {
          if(bookings.length >0){
            res.status(200).json(bookings)
          }else{
            res.status(400).json({"msg": "no bookings"})
          }
        })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
} 

const getBookings = async (req, res) => {
  try {
    const email = req.body.email;
    await bookingModel.find({userId: email, bookingStatus: true}).then(async(bookings) => {
      if(bookings.length > 0){
        let data = []
        let user = await userModel.findOne({email: email});
        let promise = bookings.map(async(booking) => {
          await carModel.findById(booking.carId).then(async (car) => {
            booking.dtime =
              parseInt(booking.dtime.split(":")[0]) +
              3 -
              ":" +
              booking.dtime.split(":")[1];
            data.push({booking, car})
          });
        })
        Promise.all(promise).then(() => {
          res.status(200).json({"data": data, "status": user?.kycStatus})
        })
      }else{
        res.status(400).json({msg: "No Bookings Available"})
      }
    })
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}; 

const confirmBook = async(req, res) => {
    try {
        const newTempBooking = new tempBooking({
          date: req.body.date,
          time: req.body.time,
          dtime: req.body.dtime,
          ddate: req.body.ddate,
          location: req.body.location,
          carId: req.body.carid,
          service: req.body.service,
          userId: req.body.email,
        });
        id = newTempBooking._id;
        await newTempBooking.save().then(() => {
          res.status(200).json({"msg": newTempBooking._id})
        });
    } catch (error) {
      console.log(error)
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}

const getTempData = async(req, res) => {
    try {
        const id = req.params.id;
        await tempBooking.findById(id).then(async(data) => {
            await carModel.findById(data.carId).then(car => {
                let resp = {
                  carId: car._id,
                  email: req.body.email,
                  brand: car.brand,
                  price: car.amount,
                  time: data.time,
                  dtime: data.dtime,
                  location: data.location.toLowerCase(),
                  date: data.date,
                  ddate: data.ddate,
                };
                res.status(200).json(resp);
            })
        })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}

//utills
class changeTime{
  constructor(time) {
    this.time = "";
    this.m = parseInt(time.split(":")[0]);
    this.n = time.split(":")[1];
    this.m += 3;
    if(this.m <= 9){this.checkLess(this.m)}else{this.exceeds()}
  }
  checkLess(hs){
    hs = "0" + hs;
    this.time = hs + ":" + this.n;
  }
  exceeds(){
    if(this.m > 23){
      this.diff = this.m - 24;
      this.checkLess(this.diff)
    }else{
      this.time = this.m+":"+this.n
    }
  }
}

const bookCar = async(req, res) => {
    if(req.method == "GET"){
        const id = req._parsedUrl.query.split("=")[1];
        let booking = await tempBooking.findById(id)
        if (booking != null) {
          const car = await carModel.findById(booking.carId);
          const stDt = new Date(booking.date + "T" + booking.time + "Z");
          const edDt = new Date(booking.ddate + "T" + booking.dtime + "Z");
          let diff = Math.abs(edDt - stDt);
          let data = {};
          let hrs = Math.round(diff / 3.6e6);
          let hrlyCharges = parseInt(car.amount) / 24;
          console.log(diff, hrs, hrlyCharges)
          let totalAmount =
            booking.service == "Self"
              ? Math.round(hrlyCharges * hrs)
              : (Math.round(hrlyCharges * hrs))+parseInt(process.env.DRIVECHARGE);
          let gst = Math.round(parseFloat(process.env.GST) * totalAmount);
          if (
            hrs != null ||
            (hrs != undefined && gst != null) ||
            (gst != undefined && totalAmount != null) ||
            totalAmount != undefined
          ) {
            console.log(booking.service, "service")
            data.brand = car.brand;
            data.location = car.location;
            data.date = booking.date;
            data.ddate = booking.ddate;
            data.time = booking.time;
            data.dtime = booking.dtime;
            data.email = "@"+booking.userId.split("@")[0];
            data.service = booking.service;
            data.serviceCharges = booking.service == "Self"
              ? 0 : process.env.DRIVECHARGE;
            data.price = parseInt(car.amount);
            data.gst = gst;
            data.days = Math.round((hrs / 24).toFixed(2));
            data.tamount = totalAmount;
            data.amount = totalAmount + gst;
          
            res.render("confirmBook.ejs", { id, data });
          } else {
            res.render("400.ejs", {
              t: 500,
              sub: "Something Went wrong, Please try again",
            });
          }
        } else {
          res.render("400.ejs", {
            t: 500,
            sub: "Something Went wrong, Please try again",
          });
        }
    }else if(req.method == "POST"){
        try {
          const body = req.body;
          const booking = await tempBooking.findById(body.tempid);
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
            let timeObj = new changeTime(booking.dtime);
            const newBooking = new bookingModel({
              time: booking.time,
              dtime: timeObj.time,
              userId: body.email,
              service: booking.service,
              carId: car._id,
              price: totalAmount + gst,
              startDate: booking.date,
              paymentStatus: "Paid",
              dropDate: booking.ddate,
              transactionID: req.body.trId
            });
            await tempBooking.findOneAndDelete({ carId: car._id });
            await newBooking.save().then(async () => {
              let html = `
                    <div><b style="display: inline-block;">Booking By:</b> <p>${
                      body.email
                    }</p></div> 
                    </br>
                    <div>
                      <b style="display: inline-block;">User phone:</b> <p>${
                        body.phone
                      }</p>
                    </div> 
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking date:</b> <p>${
                          booking.date
                        }</p> 
                      </div>
                    </br>
                      <div>
                        <b style="display: inline-block;">Drop date:</b> <p>${
                          booking.ddate
                        }</p>
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking time:</b> <p>${
                          booking.time
                        }</p> 
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Car brand:</b> <p>${
                          car.brand
                        }</p> 
                      </div>
                    </br> 
                      <div>
                      <b style="display: inline-block;">Total Amount:</b> <p>${
                        totalAmount + gst
                      }</p> 
                      </div>
                      `;
              let executiveMail = process.env.MAIL;
              let user = await userModel.findOne({ email: body.email });
              await mail("New Booking", html, executiveMail).catch();
              let msg;
              const token = newBooking._id;
              if (user.kycStatus) {
                msg = `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount: ₹${
                  totalAmount + gst
                }</b> 

                <a href="https://maps.app.goo.gl/sNiTJBNERFbrtcRQA" style="margin-bottom: 20px;">
                      Our Address: RK Beach Rd, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530002
                    </a>
                <p style="color:red;">If this booking is not booked by you, then please cancel the order</p>
                <a href="https://${process.env.DOMAIN}/booking/cancel/${token}">
                  <button>
                    Cancel booking
                  </button>
                </a>
                `;
              } else {
                msg = `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount: ₹${
                  totalAmount + gst
                }</b> 
                    <p>Your KYC is pending, Go to the RK Beach Hub for full kyc registeration. Bring the below given documents xerox copies to the hub.</p>
                    <ul>
                      <li>Aadhaar Card</li>
                      <li>License Id</li>
                      <li>Address Proof</li>
                    </ul>
                    </br>
                    </br>
                    <a href="https://maps.app.goo.gl/sNiTJBNERFbrtcRQA" style="margin-bottom: 20px;">
                      Our Address: RK Beach Rd, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530002
                    </a>
                    </br>
                    <p style="color:red;">If this booking is not booked by you, then please cancel the order</p>
                    <a href="https://${
                      process.env.DOMAIN
                    }/booking/cancel/${token}">
                      <button>
                        Cancel booking
                      </button>
                    </a>
                    `;
              };
              let vendor_mail = car.vendor;
              await mail(
                "Booking Placed",
                `
                    <div><b style="display: inline-block;">Booking By:</b> <p>${
                      body.email
                    }</p></div> 
                    </br>
                      <div>
                        <b style="display: inline-block;">Booking date:</b> <p>${
                          booking.date
                        }</p> 
                      </div>
                    </br>
                      <div>
                        <b style="display: inline-block;">Drop date:</b> <p>${
                          booking.ddate
                        }</p>
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking time:</b> <p>${
                          booking.time
                        }</p> 
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Car brand:</b> <p>${
                          car.brand
                        }</p> 
                      </div>
                      </br> 
                      <div>
                        <b style="display: inline-block;">Booking date:</b> <p>${
                          (car.location, car.place)
                        }</p> 
                      </div>
                      `,
                vendor_mail
              );
              await mail("Booking placed", msg, body.email).catch();
              res.status(200).json({ msg: "car booked" });
            });
          }
        } catch (error) {
          console.log(error)
        }
    }
}

const updatePayment = async(req, res) => {
    try {
      const body = req.body;
      await userModel.findOne({email: req.body.email}).then(async(user) => {
        if(user.role === "Admin" || user.role === "Executive"){
          await bookingModel.findById(body.bookingId).then((bill) => {
            if(bill != null){
              bill.time = body.time;
              bill.dtime = body.dtime;
              bill.paymentStatus = body.paymentStatus;
              bill.bookingStatus = body.bookingStatus;
              bill.startDate = body.startDate;
              bill.dropDate = body.dropDate;
              bill.save().then(() => {
                res.status(200).json({ msg: "Changes Saved" });
              });
            }
          });
        }
      })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}


// const payment = async(req, res) => {
//   try {
//     let id = req.params.id
//     if(req.method == "GET"){
//         res.render("bill.ejs", { merchant: process.env.MERCHANT,  id: id });
//     }else if(req.method == "POST"){
//       await bookingModel.findById(id).then(booking => {
//         if(booking != null){
//           res.status(200).json({"price": booking.price})
//         }
//       })
//     }
//   } catch (error) {
//     res.render("400.ejs", { t: 500, sub: "Something went wrong" });
//   }
// }

const autoDelete = async(req, res) => {
  try {
    let date = new Date().toISOString().split("T")[0];
    await bookingModel.find({dropDate: date, bookingStatus: true}).then(async(bookings) => {
      if(bookings.length > 0){
        bookings.forEach(async (booking) => {
          booking.bookingStatus = false;
          await booking.save().then(() => {
            console.log("bookings marked")
          });
        })
      }
    })
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

const deleteBooking = async (req, res) => {
  try {
    let id = req.params.id;
    const booking = await bookingModel.findByIdAndDelete(id);

    if (booking) {
      const user = await userModel.findOne({ email: booking.userId });
      if (user) {
        const mailContent = `
          <p>Dear ${user.email},</p>
          <p>Your booking with booking ID ${booking._id} has been canceled successfully.</p>
          <p>If you have any further questions or concerns, please feel free to contact us.</p>
          <p>Best regards,</p>
          <p>Your Car Rental Service</p>
        `;
        await mail("Booking Canceled", mailContent, user.email);
        res.redirect("/");
      } else {
        res.redirect("/");
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.render("400.ejs", {
      t: "500",
      sub: "Server Error",
    });
  }
};

module.exports = {
  bookCar,
  confirmBook,
  getTempData,
  getAllBookings,
  // payment,
  getBookings,
  updatePayment,
  autoDelete,
  deleteBooking,
};
