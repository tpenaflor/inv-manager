const { Product, Category, Supplier, Transaction } = require('../models');
const { validationResult } = require('express-validator');
const { generateSKU, paginate } = require('../utils/helpers');
const { Op } = require('sequelize');

const getAllProducts = async (req, res) => {
  try {
    const { page, limit, search, category, lowStock } = req.query;
    const { limit: pageLimit, offset } = paginate(page, limit);

    let whereClause = { isActive: true };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      whereClause.categoryId = category;
    }

    if (lowStock === 'true') {
      whereClause[Op.and] = [
        { stockQuantity: { [Op.lt]: { [Op.col]: 'minStockLevel' } } }
      ];
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
      ],
      limit: pageLimit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      products: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page) || 1,
        limit: pageLimit,
        pages: Math.ceil(products.count / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { 
          model: Transaction, 
          as: 'transactions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      categoryId,
      supplierId,
      price,
      cost,
      stockQuantity,
      minStockLevel,
      maxStockLevel,
      unit,
      location,
      barcode
    } = req.body;

    // Generate SKU if not provided
    let sku = req.body.sku;
    if (!sku) {
      const category = await Category.findByPk(categoryId);
      sku = generateSKU(category?.name || 'GEN', name);
    }

    const product = await Product.create({
      name,
      description,
      sku,
      barcode,
      categoryId,
      supplierId,
      price,
      cost,
      stockQuantity: stockQuantity || 0,
      minStockLevel: minStockLevel || 10,
      maxStockLevel,
      unit: unit || 'piece',
      location
    });

    // Create initial stock transaction if stockQuantity > 0
    if (stockQuantity > 0) {
      await Transaction.create({
        productId: product.id,
        userId: req.user.id,
        type: 'in',
        quantity: stockQuantity,
        previousStock: 0,
        newStock: stockQuantity,
        reason: 'Initial stock',
        notes: 'Product creation'
      });
    }

    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: createdProduct
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'SKU or barcode already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update(req.body);

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({ isActive: false });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, reason, notes } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await product.update({ stockQuantity: newStock });

    await Transaction.create({
      productId: product.id,
      userId: req.user.id,
      type: quantity > 0 ? 'in' : 'out',
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      reason,
      notes
    });

    res.json({
      message: 'Stock adjusted successfully',
      product: {
        id: product.id,
        name: product.name,
        previousStock,
        newStock,
        adjustment: quantity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};