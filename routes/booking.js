const { bookCar, confirmBook, getTempData, getAllBookings, getBookings, updatePayment, deleteBooking } = require("../controllers/booking");
const authMiddleware = require("../middlewares/auth");
require("dotenv").config()
const bookingRouter = require("express").Router();

bookingRouter.get("/book", bookCar);
bookingRouter.get("/bookings", authMiddleware, getAllBookings);
bookingRouter.post("/confirmBooking", authMiddleware, confirmBook);
bookingRouter.get("/getTempData/:id", authMiddleware, getTempData);
bookingRouter.post("/book", authMiddleware, bookCar);
bookingRouter.delete("delete/:id", authMiddleware, deleteBooking);

// bookingRouter.get("/payment/:id", payment);
// bookingRouter.post("/payment", authMiddleware, payment);
bookingRouter.patch("/updateStatus", authMiddleware, updatePayment);

bookingRouter.get("/", (req, res) => {
    res.render("bookings.ejs", { merchant: process.env.MERCHANT });
});
bookingRouter.get("/get", authMiddleware, getBookings);

module.exports = bookingRouter