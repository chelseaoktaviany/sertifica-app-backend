const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');

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

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, msg, req, res) => {
  const token = signToken(user._id);

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
    },
    token,
  });
};

// multer storage
const multerStorage = multer.memoryStorage();

// multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('You must fill your profile picture', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload user photo
exports.uploadUserPhoto = upload.single('profileImage');

// resizing uploaded image (middleware)
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

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

  const filteredBody = filterObj(
    req.body,
    'name',
    'firstName',
    'lastName',
    'companyName',
    'address',
    'emailAddress',
    'nomorHP',
    'jobTitle',
    'postalCode',
    'role'
  );

  // console.log(filteredBody);

  if (req.file) filteredBody.profileImage = req.file.filename;

  const user = await User.findOne({
    emailAddress,
  });

  if (user) {
    return next(new AppError('E-mail sudah terdaftar', 409));
  }

  const newUser = await User.create(filteredBody);

  console.log(newUser);

  try {
    // email untuk OTP
    newUser.otp = await generateAndSaveOtp(newUser);
    newUser.save({ validateBeforeSave: false });

    // console.log(newUser);

    await new Email(newUser).sendOTP();

    // mengirim response
    res.status(201).json({
      status: 0,
      msg: 'Success! E-mail berisi OTP akan dikirim',
    });
  } catch (err) {
    newUser.otp = undefined;
    newUser.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Ada kesalahan yang terjadi saat mengirim e-mail, mohon dicoba lagi',
        500
      )
    );
  }
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

    // console.log(existedUser);

    user.OTP = await generateAndSaveOtp(user);
    user.save({ validateBeforeSave: false });

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
    user.save({ validateBeforeSave: false });

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
  }

  // memeriksa jika OTP benar
  if (otp !== user.otp) {
    return next(new AppError('Kode OTP salah', 401));
  }

  // memeriksa jika kode OTP kedaluarsa
  if (user.otpExpiration < new Date()) {
    user.otp = undefined;
    user.otpExpiration = undefined;
    user.save({ validateBeforeSave: false });

    return next(new AppError('OTP sudah kedaluarsa', 401));
  }

  // otp is valid
  user.otp = undefined;
  user.otpExpiration = undefined;
  user.save({ validateBeforeSave: false });

  // create token
  createSendToken(user, 200, 'Berhasil verifikasi OTP', req, res);
});
