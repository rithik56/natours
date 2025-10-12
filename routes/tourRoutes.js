const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

// tourRouter.param('id', (req, res, next, val) => {
//   const id = val * 1;
//   const toursLength = tours.length;

//   if (id > toursLength) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }

//   const tour = tours.find((t) => t.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'tour not found',
//     });
//   }

//   next();
// });

// const checkBody = (req, res, next) => {
//   const { name, price } = req.body;
//   if (!name || !price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'invalid data',
//     });
//   }
//   next();
// };

tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter
  .route('/top-5-cheap')
  .get(tourController.top5CheapTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);
tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getPlan,
  );

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

tourRouter
  .route('/tour-distances/center/:latlng/unit/:unit')
  .get(tourController.getTourDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = tourRouter;
