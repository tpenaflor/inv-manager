const express = require('express');
const { body } = require('express-validator');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').notEmpty().trim()
];

// Routes
router.get('/', auth, getAllCategories);
router.post('/', auth, adminOnly, categoryValidation, createCategory);
router.put('/:id', auth, adminOnly, categoryValidation, updateCategory);
router.delete('/:id', auth, adminOnly, deleteCategory);

module.exports = router;