const { User, Category, Supplier } = require('../models');

const seed = async () => {
  try {
    console.log('Starting database seeding...');

    // Create default admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@inventory.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin'
      });
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log('Admin user already exists');
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Office Supplies', description: 'Office and stationery items' },
      { name: 'Hardware', description: 'Hardware tools and equipment' },
      { name: 'Software', description: 'Software licenses and applications' }
    ];

    for (const categoryData of defaultCategories) {
      const existing = await Category.findOne({ where: { name: categoryData.name } });
      if (!existing) {
        await Category.create(categoryData);
        console.log(`Category created: ${categoryData.name}`);
      }
    }

    // Create default supplier
    const defaultSupplier = {
      name: 'Default Supplier',
      email: 'supplier@example.com',
      phone: '+1-555-0123',
      address: '123 Business Street, City, State 12345',
      contactPerson: 'John Supplier'
    };

    const existingSupplier = await Supplier.findOne({ where: { name: defaultSupplier.name } });
    if (!existingSupplier) {
      await Supplier.create(defaultSupplier);
      console.log('Default supplier created');
    }

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();