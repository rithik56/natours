const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate value ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorsDB = (err) => new AppError(err.message, 400);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  console.log('<<< err', err);
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message,
      });
    }
    return;
  }
  // Programming or other unknown error: don't leak error details
  // console.error('ERROR 💥', err);
  if (req.originalUrl.startsWith('/api')) {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  } else {
    res.status(500).render('error', {
      title: 'Something went wrong!',
      message: 'Please try again later.',
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log('err.name', err.name);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    } else if (err.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    } else if (err.name === 'ValidationError') {
      err = handleValidationErrorsDB(err);
    } else if (err.name === 'JsonWebTokenError') {
      err = new AppError('token is invalid. Please login again', 401);
    } else if (err.name === 'TokenExpiredError') {
      err = new AppError('token is expired. Please login again', 401);
    }
    sendErrorProd(err, req, res);
  }
};
