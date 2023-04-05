const mongoose = require('mongoose');

// adding certificate category
const certCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Mohon isi kategori untuk sertifikat'],
    unique: true,
  },
});

const certificateSchema = new mongoose.Schema(
  {
    file: String,
    fileName: {
      type: String,
      required: [true, 'Mohon isi nama file untuk sertifikat'],
    },
    category: {
      type: mongoose.Schema.Types.String,
      ref: 'CertCategory',
    },

    // recepient
    recepient: {
      name: {
        type: String,
        required: [true, 'Mohon isi nama pemilik sertifikat'],
      },
      emailAddress: {
        type: String,
        required: [true, 'Mohon isi alamat e-mail pemilik sertifikat'],
      },
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true }
);

// pre hook middleware
certificateSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'recepient',
  });

  next();
});

const CertCategory = mongoose.model('CertCategory', certCategorySchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = { Certificate, CertCategory };
