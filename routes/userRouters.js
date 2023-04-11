const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// router

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
router.get('/signOut', authController.signOut);

router.get('/resendOTP', resendOTPRateLimiter, authController.resendOTP);
router.post('/verified', verifyOTPRateLimiter, authController.verifyOTP);

router.use(authController.protect);

// get user certificates
router.get('/:userId/certificates', userController.getUserCertificates);

// user management
router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers);

module.exports = router;
