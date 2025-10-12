const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const Tour = require('../models/tourModel');
const factory = require('./factoryController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image')) {
    cb(new AppError('Please upload image only'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

const outputDir = path.join(__dirname, '../public/img/tours');

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  const coverImageFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  req.body.imageCover = coverImageFilename;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, coverImageFilename));

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .jpeg({ quality: 90 })
        .toFile(path.join(outputDir, filename));

      req.body.images.push(filename);
    }),
  );

  next();
});

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $project: {
        _id: 0,
        difficulty: '$_id',
        numTours: 1,
        numRatings: 1,
        avgRating: 1,
        avgPrice: 1,
        minPrice: 1,
        maxPrice: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $addFields: {
        startDate: '$startDates',
      },
    },
    {
      $match: {
        startDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $addFields: {
        month: { $month: '$startDate' },
      },
    },
    {
      $group: {
        _id: '$month',
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        numTours: 1,
        tours: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.top5CheapTours = (req, res, next) => {
  req.customQuery = {
    limit: '5',
    sort: '-ratingsAverage,price',
    fields: 'name,price,difficulty,summary,ratingsAverage',
  };
  next();
};

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }).explain();

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getTourDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const data = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data,
    },
  });
});

exports.getAllTours = factory.getAll(Tour);

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
