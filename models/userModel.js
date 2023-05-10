const mongoose = require('mongoose');
const validator = require('validator');

// membuat sebuah publisher
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function () {
        if (this.role === 'Publisher' && this.role === 'Admin') {
          return [true, 'You must enter your full name'];
        }
      },
      get: function () {
        return `${this.firstName} ${this.lastName}`;
      },
      set: function (value) {
        const parts = value.split(' ');
        this.firstName = parts[0];
        this.lastName = parts[1];
      },
      trim: true,
    },
    firstName: {
      type: String,
      required: function () {
        if (this.role !== 'Publisher' && this.role !== 'Admin') {
          return [true, 'You must enter your first name'];
        }
      },
      trim: true,
    },
    lastName: {
      type: String,
      required: function () {
        if (this.role !== 'Publisher' && this.role !== 'Admin') {
          return [true, 'You must enter your last name'];
        }
      },
      trim: true,
    },
    companyName: {
      type: String,
      required: function () {
        if (this.role === 'Publisher') {
          return [true, 'You must enter your company name'];
        }
      },
      trim: true,
    },
    address: {
      type: String,
      required: function () {
        if (this.role === 'Publisher') {
          return [true, 'You must enter your address'];
        }
      },
      trim: true,
    },
    emailAddress: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'You must enter your e-mail id'],
      validate: [
        validator.isEmail,
        'Make sure you have a valid e-mail address',
      ],
      trim: true,
    },
    nomorHP: {
      type: String,
      required: [true, 'You must enter your phone number'],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: function () {
        if (this.role === 'Publisher') {
          return [true, 'You must enter your job title'];
        }
      },
      trim: true,
    },
    postalCode: {
      type: String,
      required: function () {
        if (this.role === 'Publisher') {
          return [true, 'You must enter your postal code'];
        }
      },
      trim: true,
    },
    profileImage: {
      type: String,
      default: 'uploads/users/default.jpeg',
    },
    otp: {
      type: String,
      expires: '5m',
      index: true,
    },
    otpExpiration: Date,
    isActive: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['Admin', 'Publisher', 'Certificate Owner'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
