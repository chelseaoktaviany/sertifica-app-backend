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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recepientName: {
      type: mongoose.Schema.Types.String,
      ref: 'User',
      required: [true, 'Mohon isi nama pemilik sertifikat'],
    },
    recepientEmailAddress: {
      type: mongoose.Schema.Types.String,
      ref: 'User',
      required: [true, 'Mohon isi alamat e-mail pemilik sertifikat'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// pre hook middleware
certificateSchema.pre(/^find/, function (next) {
  this.populate('recepient').populate({
    path: 'recepient',
    select: 'firstName lastName emailAddress profileImage',
  });

  next();
});

const CertCategory = mongoose.model('CertCategory', certCategorySchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = { Certificate, CertCategory };
