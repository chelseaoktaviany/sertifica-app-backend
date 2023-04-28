const multer = require('multer');

// controllers
const factory = require('./handlerFactory');

// util
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// models
const { Certificate, CertCategory } = require('../models/certificateModel');
const User = require('../models/userModel');

// multer storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/certificates/');
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop();
    cb(null, `certificate-${Date.now()}.${extension}`);
  },
});

// multer filter
const multerFilter = (req, file, cb) => {
  const validExtensions = ['.jpg', '.jpeg', '.png'];
  const fileExtension = file.originalname.split('.').pop();
  if (validExtensions.includes(`.${fileExtension}`)) {
    cb(null, true);
  } else {
    cb(new AppError('Mohon upload file sertifikat', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload user photo
exports.uploadFile = upload.single('file');

// resizing uploaded image (middleware)
// exports.resizeFile = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   req.body.file = `certificate-${Date.now()}.jpeg`;

//   sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/certificates/${req.body.file}`);

//   next();
// });

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
    'category',
    'recepient',
    'recepientName',
    'recepientEmailAddress'
  );

  // saving file to database
  // if (req.file) filteredBody.file = req.file.filename;

  const certCategory = await CertCategory.findOne({
    category: filteredBody.category,
  });

  const recepient = await User.findOne({
    _id: filteredBody.recepient,
    role: 'Certificate Owner',
  });

  if (!recepient || !recepient.emailAddress) {
    return next(new AppError('This e-mail has not been registered', 404));
  }

  if (!certCategory) {
    return next(new AppError('Category not found', 404));
  }

  const certificate = await Certificate.create({
    file: req.file.path,
    fileName: filteredBody.fileName,
    category: filteredBody.category,
    recepient: filteredBody.recepient,
    recepientName: filteredBody.recepientName,
    recepientEmailAddress: filteredBody.recepientEmailAddress,
  });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil menambahkan data sertifikat',
    data: { certificate },
  });
});
