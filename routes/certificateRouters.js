const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

// routers
router.use(authController.protect);

router.use(authController.restrictTo('publisher'));

// certificate manipulation

// certificate category
router.post('/category', certificateController.addCertCategory);

// certificates
router
  .route('/')
  .get(certificateController.getAllCertificates)
  .post(
    certificateController.uploadFile,
    certificateController.resizeFile,
    certificateController.publishCertificate
  );

module.exports = router;