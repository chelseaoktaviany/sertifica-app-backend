const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certCategoryController = require('../controllers/certCategoryController');

const router = express.Router();

router.use(authController.protect);

// certificate routers

// router.use(authController.restrictTo('Publisher'));

// certificate category
router
  .route('/')
  .get(certCategoryController.getAllCertCategories)
  .post(certCategoryController.addCertCategory);

module.exports = router;
