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

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, unique: true },
    file: String,
    fileName: {
      type: String,
      required: [true, 'Mohon isi nama file untuk sertifikat'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertCategory',
      required: [true, 'Kategori harus ada di sertifikat'],
    },
    categoryName: {
      type: mongoose.Schema.Types.String,
      ref: 'CertCategory',
      required: [true, 'Nama kategori harus ada di sertifikat'],
    },
    recepient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pemilik sertifikat harus ada di sertifikat'],
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
    isClaimed: {
      type: Boolean,
      default: false,
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
  this.populate('category').populate({
    path: 'category',
    select: 'categoryName cerCategorySlug',
  });

  this.populate('recepient').populate({
    path: 'recepient',
    select: 'firstName lastName emailAddress profileImage',
  });

  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
