// controllers
const factory = require('./handlerFactory');

const CertCategory = require('../models/certCategoryModel');

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

// update certificate category
exports.editCertCategory = factory.updateOne(
  CertCategory,
  'Updated category successful'
);

// delete category
exports.deleteCertCategory = factory.deleteOne(
  CertCategory,
  'Delete category successful'
);
