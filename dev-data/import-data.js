const fs = require('fs');
const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  // console.log('DB connection successful');
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf-8'),
);

if (process.argv[2] === '--import') {
  const promises = [
    Tour.create(tours),
    User.create(users, { validateBeforeSave: false }),
    Review.create(reviews),
  ];

  Promise.all(promises)
    .then(() => {})
    .catch(() => {})
    .finally(() => {
      process.exit();
    });
} else if (process.argv[2] === '--delete') {
  const promises = [Tour.deleteMany(), User.deleteMany(), Review.deleteMany()];

  Promise.all(promises)
    .then(() => {})
    .catch(() => {})
    .finally(() => {
      process.exit();
    });
}
