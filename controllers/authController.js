const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/sendEmail');

const signJwt = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const verifyJwt = (token) => jwt.verify(token, process.env.JWT_SECRET);

const createSendToken = (user, statusCode, res) => {
  const token = signJwt(user._id);

  const cookieOptions = {
    httpOnly: true,
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  return res.status(statusCode).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const resemail = await new Email(
    user,
    `${req.protocol}://${req.get('host')}/me`,
  ).welcomeEmail();

  console.log(resemail);

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    '+password',
  );

  if (!user || !(await user.correctPassword(req.body.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // if token is absent
  if (!req.cookies.jwt) {
    return next(new AppError('token is absent', 401));
  }
  const token = req.cookies.jwt;

  // if token is invalid i.e. tampered or expired
  const decoded = verifyJwt(token);

  // if user is deleted after the token is issued
  const user = await User.findById(decoded.id).select('+password');

  if (!user) {
    return next(
      new AppError(
        'no user found. Please login again with different credentials',
        401,
      ),
    );
  }

  // if user has changed the password after the token is issued
  const isPasswordChangedError = user.passwordChangedAfter(decoded.iat);

  if (isPasswordChangedError) {
    return next(
      new AppError('your password got changed. Please login again', 401),
    );
  }

  req.user = user;
  res.locals.user = user;

  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgetPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('email is required', 400));
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('no user found the email', 404));
  }

  const token = user.createTokenForResetPassword();

  await user.save({ validateBeforeSave: false });

  try {
    await Email(
      user,
      `${req.protocol}://${req.get(
        'host',
      )}/api/v1/users/resetPassword/${token}`,
    ).resetPassword();
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('there was an error sending the email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'token sent to email',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // what will be the payload for reset password functionality
  // password, confirm password

  // token in the params
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // find the user based on the hashed token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('token is invalid or expired', 400));
  }

  // if user if found, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // clear the reset token fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // update changedPasswordAt property for the use
  user.changedPasswordAt = Date.now();

  await user.save();

  // send the jwt token to the client

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // we have to fetch the user since we have to update the password using req.user.id
  const user = await User.findById(req.user.id).select('+password');

  // compare the user password with the posted password
  const isPasswordCorrect = await user.correctPassword(
    req.body.currentPassword,
  );

  if (!isPasswordCorrect) {
    return next(new AppError('your current password is wrong', 401));
  }

  // if so, update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('use update password route', 400));
  }

  const { name, email } = req.body;

  const filteredBody = {
    name,
    email,
  };

  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  user.active = false;

  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    // if token is absent
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;

      // if token is invalid i.e. tampered or expired
      const decoded = verifyJwt(token);

      // if user is deleted after the token is issued
      const user = await User.findById(decoded.id).select('+password');

      if (!user) {
        return next();
      }

      // if user has changed the password after the token is issued
      const isPasswordChangedError = user.passwordChangedAfter(decoded.iat);

      if (isPasswordChangedError) {
        return next();
      }

      res.locals.user = user;
      return next();
    }

    next();
  } catch (err) {
    next();
  }
};

exports.logout = async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({ status: 'success' });
};
