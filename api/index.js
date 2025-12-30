require('dotenv').config({ path: './config.env' });

const mongoose = require('mongoose');
const app = require('../app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Reuse Mongoose connection across Vercel function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(DB, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log('DB connection successful');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('DB connection error:', err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async (req, res) => {
  try {
    await connectDB(); // Ensure DB is connected before handling the request
    return app(req, res);
  } catch (err) {
    console.error('Request-level DB connect error:', err);
    res.status(500).send('Database connection error');
  }
};


