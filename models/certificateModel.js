const mongoose = require('mongoose');

// function
function generateCertificateID() {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 64;
  let certificateId = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    certificateId += characters.charAt(randomIndex);
  }

  return certificateId;
}

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
    certificateId: { type: String, unique: true },
    file: String,
    fileName: {
      type: String,
      required: [true, 'Mohon isi nama file untuk sertifikat'],
    },
    category: {
      type: mongoose.Schema.Types.String,
      ref: 'CertCategory',
    },
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
certificateSchema.pre('save', function (next) {
  // Generate the certificate ID
  const certificateId = generateCertificateID();
  this.certificateId = certificateId;
  next();
});

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
