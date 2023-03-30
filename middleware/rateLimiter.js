const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const resendOTPRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // batasan untuk IP menjadi 3 permintaan kirim ulang OTP
  handler: function (req, res, next) {
    return next(
      new AppError(
        'Gagal mengirim OTP sebanyak 3 kali, coba lagi dalam 1x24 jam/besok',
        429
      )
    );
  },
  headers: true,
});

const verifyOTPRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3, // batasan untuk IP menjadi 3 permintaan kirim ulang OTP
  handler: function (req, res, next) {
    return next(
      new AppError(
        'Anda telah gagal mencoba sebanyak 3 kali, silakan coba lagi dalam 1x24 jam',
        429
      )
    );
  },
  headers: true,
});

module.exports = { resendOTPRateLimiter, verifyOTPRateLimiter };
