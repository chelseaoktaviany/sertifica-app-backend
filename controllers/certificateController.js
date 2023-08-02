const multer = require('multer');

const path = require('path');

// controllers
const factory = require('./handlerFactory');

// util
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// models
const Certificate = require('../models/certificateModel');
const CertCategory = require('../models/certCategoryModel');

const User = require('../models/userModel');

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `certificate-${Date.now()}${ext}`);
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
    cb(new AppError('Mohon upload file sertifikat', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});

// upload user photo
exports.uploadFile = upload.single('file');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// get all certificates

exports.getAllCertificates = factory.getAll(
  Certificate,
  'Berhasil mengakses data sertifikat'
);

// get certificates
exports.getCertificate = factory.getOne(
  Certificate,
  { path: '_id' },
  'Berhasil mengakses data sertifikat'
);

// add certificate
exports.publishCertificate = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'fileName',
    'categoryName',
    'recepientName',
    'recepientEmailAddress'
  );

  const url = `${req.protocol}://${req.get('host')}/v1/ser`;

  const certCategory = await CertCategory.findOne({
    categoryName: filteredBody.categoryName,
  });

  const recepient = await User.findOne({
    emailAddress: filteredBody.recepientEmailAddress,
    role: 'Certificate Owner',
  });

  if (!recepient || !recepient.emailAddress) {
    return next(new AppError('This e-mail has not been registered', 404));
  }

  if (!certCategory) {
    return next(new AppError('Category not found', 404));
  }

  const certificate = await Certificate.create({
    file: `${url}/uploads/certificates/${req.file.filename}`,
    fileName: filteredBody.fileName,
    category: certCategory._id,
    categoryName: filteredBody.categoryName,
    categorySlug: certCategory.cerCategorySlug,
    recepient: recepient._id,
    recepientName: filteredBody.recepientName,
    recepientEmailAddress: filteredBody.recepientEmailAddress,
  });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil menambahkan data sertifikat',
    data: certificate,
  });
});

exports.verifyCertificate = catchAsync(async (req, res, next) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findOne({ certificateId });

  if (!certificate) {
    return next(new AppError('Certificate ID not found', 404));
  }

  res.status(200).json({
    status: 0,
    msg: 'Berhasil verifikasi sertifikat',
    data: certificate,
  });
});
