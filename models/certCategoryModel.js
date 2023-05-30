const mongoose = require('mongoose');

const { generateNameSlug } = require('../utils/slugify');

// adding certificate category
const certCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Mohon isi kategori untuk sertifikat'],
    unique: true,
  },
  cerCategorySlug: {
    type: String,
    index: true,
  },
});

// prehook
certCategorySchema.pre('save', function (next) {
  if (this.isNew || this.isModified('categoryName')) {
    this.cerCategorySlug = generateNameSlug(this.categoryName);
  }
  next();
});

certCategorySchema.index({ cerCategorySlug: 1 });

const CertCategory = mongoose.model('CertCategory', certCategorySchema);

module.exports = CertCategory;
