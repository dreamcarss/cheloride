const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");
const tempBooking = require("../models/tempbooking");
const userModel = require("../models/userModel");
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
        console.log(error)
    }
} 

const getBookings = async (req, res) => {
  try {
    const email = req.body.email;
    await bookingModel.find({userId: email, bookingStatus: true}).then(async(bookings) => {
      if(bookings.length > 0){
        let data = []
        let promise = bookings.map(async(booking) => {
          await carModel.findById(booking.carId).then(async (car) => {
            data.push({booking, car})
          });
        })
        Promise.all(promise).then(() => {
          res.status(200).json({"data": data})
        })
      }else{
        res.status(400).json({msg: "No Bookings Available"})
      }
    })
  } catch (error) {
    console.log(error);
  }
}; 

const confirmBook = async(req, res) => {
    try {
        console.log(req.body)
        const newTempBooking = new tempBooking({
          data: req.body.data,
          carId: req.body.carid,
          userId: req.body.email
        });
        id = newTempBooking._id;
        await newTempBooking.save().then(() => {
          res.status(200).json({"msg": newTempBooking._id})
        });
    } catch (error) {
        console.log(error)
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
                  time: data.data[3],
                  location: data.data[0],
                  date: data.data[1],
                  ddate: data.data[2]
                };
                res.status(200).json(resp);
            })
        })
    } catch (error) {
        console.log(error)
    }
}

const bookCar = async(req, res) => {
    if(req.method == "GET"){
        const id = req._parsedUrl.query.split("=")[1];
        await tempBooking.findById(id).then(async(booking) => {
          console.log(booking)
          if(booking != null){
            await carModel.findById(booking.carId).then((car) => {
              const stDt = new Date(booking.data[1]);
              const edDt = new Date(booking.data[2]);
              let Difference_In_Time = edDt.getTime() - stDt.getTime();
              let diff = Math.round(
                Difference_In_Time / (1000 * 3600 * 24)
              );
              let data = {};
              data.brand = car.brand;
              data.location = car.location;
              data.date = booking.data[1];
              data.ddate = booking.data[2];
              data.time = booking.data[3];
              data.email = booking.userId;
              data.price = parseInt(car.amount);
              data.amount =
                diff == 0
                  ? diff + 1 * parseInt(car.amount)
                  : diff * parseInt(car.amount);
              res.render("confirmBook.ejs", { id, data});
            });
          }else{
              res.render("confirmBook.ejs", { id });
          }
        })
    }else if(req.method == "POST"){
        try {
          const body = req.body;
          await tempBooking.findOne({userId: body.email}).then(async(booking) => {
            if(booking !=  null){
              await carModel.findById(booking.carId).then(async(car) => {
                const stDt = new Date(booking.data[1]);
                const edDt = new Date(booking.data[2]);
                let Difference_In_Time = edDt.getTime() - stDt.getTime();
                let diff = Math.round(
                  Difference_In_Time / (1000 * 3600 * 24)
                );
                const newBooking = new bookingModel({
                  time: booking.data[3],
                  userId: body.email,
                  carId: car._id,
                  price: diff == 0
                  ? diff + 1 * parseInt(car.amount)
                  : diff * parseInt(car.amount),
                  startDate: booking.data[1],
                  dropDate: booking.data[2],
                });
                await tempBooking.findOneAndDelete({ carId: car._id });
                await newBooking.save().then(async () => {
                  let html = `
                    <div><b style="display: inline-block;">Booking By:</b> <p>${body.email}</p></div> 
                    </br>
                    <div>
                      <b style="display: inline-block;">User phone:</b> <p>${body.phone}</p>
                    </div> 
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking date:</b> <p>${booking.data[1]}</p> 
                      </div>
                    </br>
                      <div>
                        <b style="display: inline-block;">Drop date:</b> <p>${booking.data[2]}</p>
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Booking time:</b> <p>${booking.data[3]}</p> 
                      </div>
                    </br> 
                      <div>
                        <b style="display: inline-block;">Car brand:</b> <p>${car.brand}</p> 
                      </div>
                    </br> 
                      <div>
                      <b style="display: inline-block;">Total Amount:</b> <p>${newBooking.price}</p> 
                      </div>
                      `;
                  let executiveMail = process.env.MAIL;
                  await mail("New Booking", html, executiveMail).catch();
                  await mail(
                    "Booking placed",
                    `<p> Your booking has been placed. Our executive will be shortly calling you about the payment and other details</p></br><b style="display: inline-block;">Total Amount:</b> <p>${
                      diff * car.amount
                    }</p>`,
                    body.email
                  ).catch();
                  res.status(200).json({ msg: "car booked" });
                });
              });
            }
          })
        } catch (error) {
          console.log(error, "error");
        }
    }
}

const updatePayment = async(req, res) => {
    try {
      const body = req.body;
      await userModel.findOne({email: req.body.email}).then(async(user) => {
        if(user.role === "admin" || user.role === "exec"){
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
        console.log(error)
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
//     console.log(error)
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
    console.log(error)
  }
}

const deleteBooking = async(req, res) => {
  try {
    let id = req.params.id;
    await bookingModel.findByIdAndDelete(id).then(async() => {
      res.status(200).json({"msg": "Booking deleted"})
    })
  } catch (error) {
    console.log(error)
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
