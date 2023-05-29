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

// certificate category
router.get(
  '/category',
  // authController.restrictTo('Publisher'),
  certificateController.getAllCertCategories
);

router.post(
  '/category',
  // authController.restrictTo('Publisher'),
  certificateController.addCertCategory
);

// certificates
router
  .route('/')
  .get(
    // authController.restrictTo('Publisher'),
    certificateController.getAllCertificates
  )
  .post(
    // authController.restrictTo('Publisher'),
    certificateController.uploadFile,
    // certificateController.resizeFile,
    certificateController.publishCertificate
  );

router.route('/:cerCategorySlug').get(
  // authController.restrictTo('Publisher'),
  certificateController.getAllCertificatesByCategory
);

// get certificate
router
  .route('/:id')
  .get(
    authController.restrictTo('Certificate Owner', 'Publisher'),
    certificateController.getCertificate
  );

module.exports = router;
