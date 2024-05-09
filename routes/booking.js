const { bookCar, confirmBook, getTempData, getAllBookings, getBookings, updatePayment, deleteBooking } = require("../controllers/booking");
const authMiddleware = require("../middlewares/auth");
const execAuth = require("../middlewares/execAuth");
const bookingModel = require("../models/booking");
require("dotenv").config()
const bookingRouter = require("express").Router();

bookingRouter.get("/book", bookCar);
bookingRouter.get("/bookings", authMiddleware, execAuth, getAllBookings);
bookingRouter.post("/confirmBooking", authMiddleware, confirmBook);
bookingRouter.get("/getTempData/:id", authMiddleware, getTempData);
bookingRouter.post("/book", authMiddleware, bookCar);
bookingRouter.get("/cancel/:id", async(req, res) => {
    try {
        const booking = await bookingModel.findOne({transactionID: req.params.id});
        if(booking){
            res.render("cancelBooking.ejs", {amount: booking.price})
        }else{
            res.render("400.ejs", { t: 404, sub: "Booking not found" });
        }
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
});

bookingRouter.delete("/delete/:id", authMiddleware, deleteBooking)

// bookingRouter.get("/payment/:id", payment);
// bookingRouter.post("/payment", authMiddleware, payment);
bookingRouter.patch("/updateStatus", authMiddleware, execAuth, updatePayment);

bookingRouter.get("/", (req, res) => {
    res.render("bookings.ejs", { merchant: process.env.MERCHANT });
});
bookingRouter.get("/get", authMiddleware, getBookings);

module.exports = bookingRouter