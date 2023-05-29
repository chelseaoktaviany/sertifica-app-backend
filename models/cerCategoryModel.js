const mongoose = require('mongoose');

// adding certificate category
const certCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Mohon isi kategori untuk sertifikat'],
    unique: true,
  },
});

const CertCategory = mongoose.model('CertCategory', certCategorySchema);

module.exports = CertCategory;
