process.on('uncaughtException', (err) => {
  console.log('uncaught exception', err);
  console.log('shutting down the server due to uncaught exception');
  process.exit(1);
});

require('dotenv').config({ path: './config.env' });

const mongoose = require('mongoose');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful');
  })
  .catch((err) => {
    console.error('DB connection error:', err);
  });

const app = require('./app');

const PORT = process.env.PORT || 8000;

// console.log('process.env.PORT', process.env.PORT);
// console.log('process.env.NODE_ENV', process.env.NODE_ENV);

const server = app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  // console.log('unhandled rejection', err);
  server.close(() => {
    console.log('shutting down the server due to unhandled rejection');
    process.exit(1);
  });
});
