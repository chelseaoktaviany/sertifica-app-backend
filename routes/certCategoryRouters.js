const express = require('express');

// controllers
const authController = require('../controllers/authController');
const certCategoryController = require('../controllers/certCategoryController');

const router = express.Router();

router.use(authController.protect);

// certificate routers

router.use(authController.restrictTo('Publisher', 'Admin'));

// certificate category
router
  .route('/')
  .get(certCategoryController.getAllCertCategories)
  .post(certCategoryController.addCertCategory);

router
  .route('/:id')
  .patch(certCategoryController.editCertCategory)
  .delete(certCategoryController.deleteCertCategory);

module.exports = router;
