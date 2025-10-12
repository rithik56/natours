const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const factory = require('./factoryController');
const User = require('../models/userModel');

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

exports.uploadUserPhoto = upload.single('photo');

const outputDir = path.join(__dirname, '../public/img/users');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `${req.user.id}-${Date.now()}.jpeg`;

  req.file.filename = filename;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, filename));

  next();
});

exports.getAllUsers = factory.getAll(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'API route not defined',
  });
};

exports.getUser = factory.getOne(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.submitFormData = catchAsync(async (req, res, next) => {
  // we will get url encoded data in req.body
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.locals.user = updatedUser;

  res.status(200).render('account', {
    title: 'Your account',
  });
});
