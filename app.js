const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const hpp = require('hpp');
const qs = require('qs');
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

/**
 * -------------------------------------------------------
 * 1️⃣ Trust Proxy (Required on Render)
 * -------------------------------------------------------
 */
app.set('trust proxy', 1);

/**
 * -------------------------------------------------------
 * 2️⃣ Template Engine Setup
 * -------------------------------------------------------
 */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/**
 * -------------------------------------------------------
 * 3️⃣ CORS Setup
 * -------------------------------------------------------
 */
app.use(cors());
app.options('*', cors());

/**
 * -------------------------------------------------------
 * 4️⃣ Stripe Webhook — Must Come BEFORE body parsers
 * -------------------------------------------------------
 * Use express.raw() for Stripe signature verification
 */
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

/**
 * -------------------------------------------------------
 * 5️⃣ Static Files & URL-encoded form data
 * -------------------------------------------------------
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * -------------------------------------------------------
 * 6️⃣ Security Headers
 * -------------------------------------------------------
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://js.stripe.com',
          "'unsafe-inline'",
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        workerSrc: ["'self'", 'blob:'],
        styleSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        imgSrc: ["'self'", 'https:', 'data:'],
        connectSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://js.stripe.com',
          'wss://*',
        ],
      },
    },
  }),
);

/**
 * -------------------------------------------------------
 * 7️⃣ JSON Parsing, Cookies, Rate Limiting, Sanitization
 * -------------------------------------------------------
 */
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter);

app.set('query parser', (str) => qs.parse(str));

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

/**
 * -------------------------------------------------------
 * 8️⃣ Logging (only in dev)
 * -------------------------------------------------------
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * -------------------------------------------------------
 * 9️⃣ Routes
 * -------------------------------------------------------
 */
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/**
 * -------------------------------------------------------
 * 🔟 404 + Global Error Handler
 * -------------------------------------------------------
 */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
