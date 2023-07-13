const multer = require('multer');
const sharp = require('sharp');

//controllers
const factory = require('./handlerFactory');

// models
const User = require('../models/userModel');
const Certificate = require('../models/certificateModel');

// util
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

  req.body.profileImage = `user-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.profileImage}`);

  next();
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const user = await User.aggregate([
    {
      $match: { isActive: true, role: { $nin: ['Admin', 'Super Admin'] } },
    },
    {
      $project: {
        _id: 1,
        name: {
          $concat: ['$firstName', ' ', '$lastName'], // combine firstName and lastName fields
        },
        profileImage: 1,
        role: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 0,
    msg: "Retrieved all users' data successfully",
    data: user,
  });
});

// get user
exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.getUser = factory.getOne(
  User,
  { path: '_id' },
  'Retrieved user data successfully'
);

exports.updateUser = factory.updateOne(User, 'Update successful');

// exports.updateUser = catchAsync(async (req, res, next) => {
//   const id = req.params.id;

//   const { name, role } = req.body;

//   const user = await User.findByIdAndUpdate(
//     { _id: id },
//     { name, role },
//     { new: true, runValidators: false }
//   );

//   if (!user) {
//     return next(new AppError('User not found', 404));
//   }

//   res.status(200).json({
//     status: 0,
//     msg: 'Update successful',
//     data: user,
//   });
// });

exports.deleteUser = factory.deleteOne(User, 'Delete successful');

exports.getUserCertificates = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  const certificates = await Certificate.find({
    recepient: id,
  });

  res.status(200).json({
    status: 0,
    results: certificates.length,
    msg: 'Berhasil mengakses sertifikat pengguna',
    data: certificates,
  });
});

exports.claimCertificate = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const certificate = await Certificate.findByIdAndUpdate(
    { _id: id },
    { isClaimed: true }
  );

  if (!certificate) {
    return next(new AppError('Certificate ID not found', 404));
  }

  res.status(200).json({
    status: 0,
    msg: 'Claim successful',
    data: certificate,
  });
});

// create certificate owner
exports.createCertificateOwner = catchAsync(async (req, res, next) => {
  const { firstName, lastName, emailAddress, nomorHP } = req.body;

  const user = await User.findOne({ emailAddress });

  if (user) {
    return next(new AppError('E-mail sudah terdaftar', 409));
  }

  const newUser = await User.create({
    firstName,
    lastName,
    emailAddress,
    nomorHP,
    role: 'Certificate Owner',
  });

  newUser.isActive = true;
  await newUser.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 0,
    msg: 'Add certificate owner successful',
    data: newUser,
  });
});
