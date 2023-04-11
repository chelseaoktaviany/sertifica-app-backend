const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

router.use(authController.protect);

// certificate routers

// certificate category
router.post(
  '/category',
  authController.restrictTo('publisher'),
  certificateController.addCertCategory
);

// certificates
router
  .route('/')
  .get(
    authController.restrictTo('publisher'),
    certificateController.getAllCertificates
  )
  .post(
    authController.restrictTo('publisher'),
    certificateController.uploadFile,
    certificateController.resizeFile,
    certificateController.publishCertificate
  );

// get certificate
router
  .route('/:id')
  .get(
    authController.restrictTo('certificate-owner'),
    certificateController.getCertificate
  );

module.exports = router;
