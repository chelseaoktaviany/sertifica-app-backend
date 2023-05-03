const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const path = require('path');
const multer = require('multer');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateOTP } = require('../utils/otp');

const Email = require('../utils/email');

// models
const User = require('../models/userModel');

// global variables
let emailAddress;

const generateAndSaveOtp = async (user) => {
  // melakukan mengirim otp
  const otp = generateOTP(4);
  user.otp = otp;
  user.otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // berlaku selama 5 menit

  await user.save();
  return otp;
};

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, msg, req, res) => {
  const token = signToken(user._id, user.role);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  });

  // mengirim hasil output (response)
  res.status(statusCode).json({
    status: 0,
    msg,
    data: {
      id: user._id,
      role: user.role,
    },
    token,
  });
};

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/users/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

// multer filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('You must fill your profile picture', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});

// upload user photo
exports.uploadUserPhoto = upload.single('profileImage');

// signup mendaftar akun pengguna menggunakan e-mail (DONE)
/**
 * Pendaftaran sebagai publisher, setelah data valid, e-mail berisi otp akan dikirim
 * @async
 * @method
 * @field - {name - nama, companyName - nama perusahaan, address - alamat, emailAddress - alamat e-mail, nomorHP - nomor HP, jobTitle - pekerjaan, postalCode - kode pos, profileImage - gambar profil publisher}
 * @returns status, msg, data:{publisher}
 * @throws - 400 (Data validation), 401 (User exists) & 500 (Internal Server Error)
 */
exports.signUp = catchAsync(async (req, res, next) => {
  emailAddress = req.body.emailAddress;

  const { name, companyName, address, nomorHP, jobTitle, postalCode, role } =
    req.body;

  const profileImage = req.file.path.replace(/\\/g, '/');

  const user = await User.findOne({
    emailAddress,
  });

  if (user) {
    return next(new AppError('E-mail sudah terdaftar', 409));
  }

  if (role === 'Admin') {
    const newAdmin = await User.create({
      name,
      companyName,
      address,
      emailAddress,
      nomorHP,
      jobTitle,
      postalCode,
      profileImage,
      role: 'Admin',
    });

    newAdmin.isActive = true;
    newAdmin.save({ validateBeforeSave: false });

    createSendToken(newAdmin, 201, 'Berhasil signup', req, res);
  } else {
    const newUser = await User.create({
      name,
      companyName,
      address,
      emailAddress,
      nomorHP,
      jobTitle,
      postalCode,
      profileImage,
      role: 'Publisher',
    });

    newUser.isActive = true;
    newUser.save({ validateBeforeSave: false });

    createSendToken(newUser, 201, 'Berhasil signup', req, res);
  }
});

// /**
//  * Sign in user, Melakukan sign in pengguna menggunakan alamat e-mail
//  * @async
//  * @method
//  * @field - {emailAddress: e-mail}
//  * @returns status, msg, data
//  * @throws - 401 (E-mail belum terdaftar), 429 (Too many requests) & 500 (Internal Server Error)
//  */
exports.signIn = catchAsync(async (req, res, next) => {
  emailAddress = req.body.emailAddress;

  const user = await User.findOne({ emailAddress });

  if (!user) {
    return next(new AppError('E-mail belum terdaftar'));
  }

  if (user.emailAddress) {
    try {
      // email untuk OTP
      user.otp = await generateAndSaveOtp(user);
      await user.save({ validateBeforeSave: false });

      await new Email(user).sendOTP();

      // mengirim response
      res.status(200).json({
        status: 0,
        msg: 'Success! E-mail berisi OTP akan dikirim',
        data: {
          emailAddress: user.emailAddress,
          role: user.role,
        },
      });
    } catch (err) {
      user.otp = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
          500
        )
      );
    }
  }
});

// /**
//  * Sign out user, Melakukan sign out pengguna untuk mengakhiri sesi
//  * @async
//  * @method
//  * @returns status, msg
//  * @throws - 500 (Internal Server Error)
//  */
exports.signOut = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 0, msg: 'Success' });
});

// /**
//  * Pengiriman OTP, mengirim OTP kepada e-mail pengguna
//  * @async
//  * @method
//  * @field - {emailAddress: e-mail}
//  * @returns status, msg
//  * @throws - 404 (User not found), 429 (Too many requests) & 500 (Internal Server Error)
//  */
exports.resendOTP = catchAsync(async (req, res, next) => {
  try {
    // email untuk OTP
    const user = await User.findOne({ emailAddress });

    user.OTP = await generateAndSaveOtp(user);
    await user.save({ validateBeforeSave: false });

    await new Email(user).sendOTP();

    // kirim response
    res.status(201).json({
      status: 0,
      msg: 'OTP telah dikirim ke e-mail, mohon periksa e-mail Anda',
    });
  } catch (err) {
    const user = await User.findOne({ emailAddress });
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Ada kesalahan yang terjadi melakukan pengiriman ulang OTP',
        500
      )
    );
  }
});

// /**
//  * Verifikasi OTP, melakukan verifikasi OTP dari e-mail
//  * @async
//  * @method
//  * @field - {id - publisher._id, otp: OTP}
//  * @returns status, msg
//  * @throws - 404 (Publisher not found), 400 (OTP invalid or wrong), 403 (OTP has been expired) & 500 (Internal Server Error)
//  */
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const otp = req.body.otp;

  const user = await User.findOne({ emailAddress });

  // memeriksa jika akun tidak ditemukan
  if (!user) {
    return next(new AppError('Akun tidak ditemukan!', 404));
  }

  if (user.isActive === false) {
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
  }

  // memeriksa jika OTP benar
  if (otp !== user.otp) {
    return next(new AppError('Kode OTP salah', 401));
  }

  // memeriksa jika kode OTP kedaluarsa
  if (user.otpExpiration < new Date()) {
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('OTP sudah kedaluarsa', 401));
  }

  // otp is valid
  user.otp = undefined;
  user.otpExpiration = undefined;
  await user.save({ validateBeforeSave: false });

  // create token
  createSendToken(user, 200, 'Berhasil verifikasi OTP', req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // getting token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'Anda belum log in, mohon lakukan login untuk mendapatkan akses token',
        401
      )
    );
  }

  // verifikasi token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // memeriksa jika pengguna sudah ada
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Token itu yang dia miliki sudah tidak ada'));
  }

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// logged in
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // verifikasi token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // memeriksa jika pengguna sudah ada
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // ada pengguna yang sudah login
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
};

// restrict to specified roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles['admin', 'super-admin'], role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have a permission to perform this action", 403)
      );
    }

    next();
  };
};
