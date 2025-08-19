const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Supplier = require('./Supplier');
const Product = require('./Product');
const Transaction = require('./Transaction');

// Define associations
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products'
});

Product.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier'
});
Supplier.hasMany(Product, {
  foreignKey: 'supplierId',
  as: 'products'
});

Transaction.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});
Product.hasMany(Transaction, {
  foreignKey: 'productId',
  as: 'transactions'
});

Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions'
});

module.exports = {
  sequelize,
  User,
  Category,
  Supplier,
  Product,
  Transaction
};