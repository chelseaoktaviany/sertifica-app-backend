const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

router.use(authController.protect);

// certificate routers

// certificate category
router.get(
  '/category',
  authController.restrictTo('Publisher'),
  certificateController.getAllCertCategories
);

router.post(
  '/category',
  authController.restrictTo('Publisher'),
  certificateController.addCertCategory
);

// certificates
router
  .route('/')
  .get(
    authController.restrictTo('Publisher'),
    certificateController.getAllCertificates
  )
  .post(
    authController.restrictTo('Publisher'),
    certificateController.uploadFile,
    certificateController.resizeFile,
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
