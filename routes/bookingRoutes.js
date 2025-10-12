const express = require('express');

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const bookingRouter = express.Router();

bookingRouter.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession,
);

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
