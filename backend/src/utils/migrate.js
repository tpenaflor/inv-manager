const { sequelize } = require('../models');

const migrate = async () => {
  try {
    console.log('Starting database migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    await sequelize.sync({ force: false, alter: true });
    console.log('Database migration completed successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();