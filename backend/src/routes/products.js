const express = require('express');
const { body } = require('express-validator');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
} = require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('cost').isFloat({ min: 0 }),
  body('categoryId').isInt({ min: 1 }),
  body('supplierId').optional().isInt({ min: 1 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('minStockLevel').optional().isInt({ min: 0 }),
  body('maxStockLevel').optional().isInt({ min: 0 })
];

const stockAdjustmentValidation = [
  body('quantity').isInt().custom(value => value !== 0),
  body('reason').notEmpty().trim()
];

// Routes
router.get('/', auth, getAllProducts);
router.get('/:id', auth, getProduct);
router.post('/', auth, productValidation, createProduct);
router.put('/:id', auth, productValidation, updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);
router.post('/:id/adjust-stock', auth, stockAdjustmentValidation, adjustStock);

module.exports = router;