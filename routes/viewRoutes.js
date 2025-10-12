const { Router } = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const viewRouter = Router();

viewRouter.use(authController.isLoggedIn);

viewRouter.get(
  '/',
  bookingController.createCheckoutBooking,
  authController.isLoggedIn,
  viewController.getOverview,
);

viewRouter.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour,
);

viewRouter.get(
  '/login',
  authController.isLoggedIn,
  viewController.getLoginForm,
);

viewRouter.get('/me', authController.protect, viewController.getAccount);
viewRouter.get('/my-tours', authController.protect, viewController.getMyTours);

viewRouter.post(
  '/submit-form-data',
  authController.protect,
  viewController.submitFormData,
);

module.exports = viewRouter;
