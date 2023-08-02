const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

router
  .route('/verification/:certificateId')
  .get(certificateController.verifyCertificate);

router.use(authController.protect);

// certificate routers

// certificates
router
  .route('/')
  .get(certificateController.getAllCertificates)
  .post(
    authController.restrictTo('Publisher'),
    certificateController.uploadFile,
    certificateController.publishCertificate
  );

// get certificate
router
  .route('/:id')
  .get(
    authController.restrictTo('Certificate Owner', 'Publisher'),
    certificateController.getCertificate
  );

module.exports = router;
