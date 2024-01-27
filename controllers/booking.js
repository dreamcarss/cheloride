const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");
const tempBooking = require("../models/tempbooking");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken")
const mail = require("../utils/mailer");
require("dotenv").config();

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
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });;
  }
}; 

const confirmBook = async(req, res) => {
    try {
        const newTempBooking = new tempBooking({
          data: req.body.data,
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
                  time: data.data[2],
                  dtime: data.data[4],
                  location: data.data[0],
                  date: data.data[1],
                  ddate: data.data[3],
                };
                res.status(200).json(resp);
            })
        })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}

const bookCar = async(req, res) => {
    if(req.method == "GET"){
        const id = req._parsedUrl.query.split("=")[1];
        let booking = await tempBooking.findById(id)
        if (booking != null) {
          const car = await carModel.findById(booking.carId);
          const stDt = new Date(booking.data[0] + "T" + booking.data[1] + "Z");
          const edDt = new Date(booking.data[2] + "T" + booking.data[3] + "Z");
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
            data.brand = car.brand;
            data.location = car.location;
            data.date = booking.data[0];
            data.ddate = booking.data[2];
            data.time = booking.data[1];
            data.dtime = booking.data[3];
            data.email = booking.userId;
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
          if (booking != null) {
            const car = await carModel.findById(booking.carId);
            const stDt = new Date(
              booking.data[0] + "T" + booking.data[1] + "Z"
            );
            const edDt = new Date(
              booking.data[2] + "T" + booking.data[3] + "Z"
            );
            let diff = Math.abs(edDt - stDt);
            let data = {};
            let hrs = diff / 3.6e6;
            let hrlyCharges = parseInt(car.amount) / 24;
            let totalAmount = Math.round(hrlyCharges * hrs);
            let gst = Math.round(parseFloat(process.env.GST) * totalAmount);
            const extTime =
              parseInt(booking.data[3].split(":")[0]) +
              3 +
              ":" +
              booking.data[3].split(":")[1];
            const newBooking = new bookingModel({
              time: booking.data[1],
              dtime: extTime,
              userId: body.email,
              carId: car._id,
              price: totalAmount + gst,
              startDate: booking.data[0],
              dropDate: booking.data[2],
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
                          booking.data[0]
                        }</p> 
                      </div>
                    </br>
                      <div>
                        <b style="display: inline-block;">Drop date:</b> <p>${
                          booking.data[1]
                        }</p>
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking time:</b> <p>${
                          booking.data[2]
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
                msg = `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount:</b> <p>${
                  totalAmount + gst
                }</p>
                <p style="color:red;">If this booking is not booked by you, then please cancel the order</p>
                    <a href="${process.env.DOMAIN}/booking/cancel/${token}">
                      <button>
                        Cancel booking
                      </button>
                    </a>`;
              } else {
                msg = `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount:</b> <p>${
                  totalAmount + gst
                }</p>
                    <p>Your KYC is pending, Go to the RK Beach Hub for full kyc registeration. Bring the below given documents xerox copies to the hub.</p>
                    <ul>
                      <li>Aadhaar Card</li>
                      <li>License Id</li>
                      <li>Address Proof</li>mo
                    </ul>
                    </br>
                    </br>
                    </br>
                    <p style="color:red;">If this booking is not booked by you, then please cancel the order</p>
                    <a href="${process.env.DOMAIN}/booking/cancel/${token}">
                      <button>
                        Cancel booking
                      </button>
                    </a>
                    `;
              }
              await mail("Booking placed", msg, body.email).catch();
              res.status(200).json({ msg: "car booked" });
            });
          }
        } catch (error) {
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

const deleteBooking = async(req, res) => {
  try {
    let id = req.params.id;
    await bookingModel.findByIdAndDelete(id).then(async() => {
      res.render("400.ejs", {"t": "Booking Canceled", "sub": "Your request for booking cancellation is successfull"})
    })
  } catch (error) {
    res.render("400.ejs", { t: 500, sub: "Something went wrong" });
  }
}

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
