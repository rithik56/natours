const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide a name'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have an email'],
    lowercase: true,
    validate: [validator.isEmail, 'provide a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'password confirm is required'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'password and confirm password must be same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    select: false,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; // remove passwordConfirm from the document
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.methods.correctPassword = async function (userPassword) {
  const res = await bcrypt.compare(userPassword, this.password);
  return res;
};

userSchema.methods.passwordChangedAfter = function (JwtTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAtTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return passwordChangedAtTimestamp > JwtTimestamp;
  }

  return false;
};

userSchema.methods.createTokenForResetPassword = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
