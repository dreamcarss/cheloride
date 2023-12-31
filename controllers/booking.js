const bookingModel = require("../models/booking");
const carModel = require("../models/carModel");
const tempBooking = require("../models/tempbooking");
const userModel = require("../models/userModel");
const mail = require("../utils/mailer");
let id;
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
    await bookingModel.findOne({userId: email}).then(async(booking) => {
      await carModel.findById(booking.carId).then(async(car) => {
        res.status(200).json({"booking": booking, "car": car})
      })
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
              data.location = booking.data[0];
              data.date = booking.data[1];
              data.ddate = booking.data[2];
              data.time = booking.data[3];
              data.email = booking.userId;
              data.price = parseInt(car.amount);
              data.amount = diff * parseInt(car.amount);
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
            console.log(booking)
            if(booking !=  null){
              await carModel.findById(booking.carId).then((car) => {
                console.log(car);
                if (car.carStatus != true) {
                  car.carStatus = true;
                  const stDt = new Date(booking.data[1]);
                  const edDt = new Date(booking.data[2]);
                  let Difference_In_Time = edDt.getTime() - stDt.getTime();
                  let diff = Math.round(
                    Difference_In_Time / (1000 * 3600 * 24)
                  );
                  car.save().then(async () => {
                    const newBooking = new bookingModel({
                      time: booking.data[3],
                      userId: body.email,
                      carId: car._id,
                      price: diff * car.amount,
                      startDate: booking.data[1],
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
                              booking.data[1]
                            }</p> 
                          </div>
                        </br>
                          <div>
                            <b style="display: inline-block;">Drop date:</b> <p>${
                              booking.data[2]
                            }</p>
                          </div>
                        </br> 
                          <div>
                            <b style="display: inline-block;">Booking time:</b> <p>${
                              booking.data[3]
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
                            diff * car.amount
                          }</p> 
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
                } else {
                  res.status(400).json({ msg: "car already booked" });
                }
              });
            }
          })
        } catch (error) {
          console.log(error);
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


const payment = async(req, res) => {
  try {
    if(req.method == "GET"){
      res.render("bill.ejs");
    }else if(req.method == "POST"){
      console.log(req.body)
      await bookingModel.findOne({userId: req.body.email}).then(booking => {
        console.log(booking)
        if(booking != null){
          res.status(200).json({"price": booking.price})
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  bookCar,
  confirmBook,
  getTempData,
  getAllBookings,
  payment,
  getBookings,
  updatePayment,
};
