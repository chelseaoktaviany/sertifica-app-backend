const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// middlewares
const {
  resendOTPRateLimiter,
  verifyOTPRateLimiter,
} = require('../middleware/rateLimiter');

const router = express.Router();

// authentication
router.post(
  '/signUp',
  authController.uploadUserPhoto,
  authController.resizeUserPhoto,
  authController.signUp
);

router.post('/signIn', authController.signIn);

router.get('/resendOTP', resendOTPRateLimiter, authController.resendOTP);
router.post('/verified', verifyOTPRateLimiter, authController.verifyOTP);

// protect
router.use(authController.protect);

// restriction middleware
router.use(authController.restrictTo('admin'));

// user management
router.route('/').get(userController.getAllUsers);

module.exports = router;
