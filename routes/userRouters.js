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
router.post('/signUp', authController.uploadUserPhoto, authController.signUp);

router.post('/signIn', authController.signIn);
router.get('/signOut', authController.signOut);

router.get('/resendOTP', resendOTPRateLimiter, authController.resendOTP);
router.post('/verified', verifyOTPRateLimiter, authController.verifyOTP);

router.use(authController.protect);

// get user
router.get('/me', userController.getMe, userController.getUser);

// get user certificates
router.get(
  '/certificates',
  authController.restrictTo('Certificate Owner'),
  userController.getUserCertificates
);

router.patch(
  '/certificates/:id/claim',
  authController.restrictTo('Certificate Owner'),
  userController.claimCertificate
);

router.post(
  '/',
  authController.restrictTo('Publisher'),
  userController.createCertificateOwner
);

router.post(
  '/check-email',
  authController.restrictTo('Publisher'),
  authController.checkEmail
);

// user management
router.use(authController.restrictTo('Admin', 'Super Admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.uploadUserPhoto, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
