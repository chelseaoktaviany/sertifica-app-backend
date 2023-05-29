const multer = require('multer');
const sharp = require('sharp');

const path = require('path');

// controllers
const factory = require('./handlerFactory');

// util
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// models
const Certificate = require('../models/certificateModel');
const CertCategory = require('../models/cerCategoryModel');

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

// get all categories
exports.getAllCertCategories = factory.getAll(
  CertCategory,
  'Berhasil mengakses data sertifikat kategori'
);

// add category
exports.addCertCategory = factory.createOne(
  CertCategory,
  'Added category successful'
);

// get all certificates

exports.getAllCertificates = factory.getAll(
  Certificate,
  'Berhasil mengakses data sertifikat'
);

exports.getAllCertificatesByCategory = catchAsync(async (req, res, next) => {
  const { cerCategorySlug } = req.params;

  const certificate = await Certificate.find({
    cerCategorySlug: cerCategorySlug,
  });

  if (!certificate) {
    return next(new AppError('No certificate found', 404));
  }

  return res.status(200).json({
    status: 0,
    result: certificate.length,
    msg: 'Retrieved data certificates successfully',
    data: certificate,
  });
});

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

  // saving file to database
  // if (req.file) filteredBody.file = req.file.filename;

  const file = req.file.path.replace(/\\/g, '/');
  const outputPath = path
    .join('uploads', 'certificates', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(file).resize({ width: 500, height: 500 }).toFile(outputPath);

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
    file: outputPath,
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
