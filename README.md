# Inventory Manager

A production-level inventory management system built with Node.js, Express, PostgreSQL, and a responsive web frontend. This system supports two user types (admin and staff) and provides comprehensive inventory management functionality.

## Features

### Core Functionality
- **User Management**: Two-tier user system (Admin and Staff)
- **Product Management**: Complete CRUD operations for products
- **Category Management**: Organize products by categories
- **Supplier Management**: Track supplier information
- **Stock Management**: Real-time stock tracking with adjustments
- **Low Stock Alerts**: Automatic monitoring of stock levels
- **Transaction History**: Complete audit trail of all stock movements

### User Roles
- **Admin**: Full system access including user management, categories, suppliers, and all product operations
- **Staff**: Product viewing, stock adjustments, and basic inventory operations

### Security Features
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- Security headers with Helmet.js
- CORS protection

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Authentication**: JWT tokens
- **Deployment**: Docker, Docker Compose, systemd services

## Quick Start

### Prerequisites

- Node.js 16+ (or use Docker)
- PostgreSQL 12+ (or use Docker)
- Git

### Option 1: Automated Installation (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tpenaflor/inv-manager.git
   cd inv-manager
   ```

2. **Run the installation script**:
   ```bash
   chmod +x scripts/install.sh
   ./scripts/install.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Default admin login: `admin@inventory.com` / `admin123`

### Option 2: Docker Deployment

1. **Clone and setup**:
   ```bash
   git clone https://github.com/tpenaflor/inv-manager.git
   cd inv-manager
   ```

2. **Create environment file**:
   ```bash
   cp backend/.env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**:
   ```bash
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

### Option 3: Manual Installation

#### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup PostgreSQL database**:
   ```sql
   CREATE DATABASE inventory_manager;
   CREATE USER inv_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE inventory_manager TO inv_user;
   ```

4. **Run migrations and seed data**:
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start the backend server**:
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

#### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Start the frontend server**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_manager
DB_USER=inv_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Admin User (for initial setup)
ADMIN_EMAIL=admin@inventory.com
ADMIN_PASSWORD=admin123
```

### Database Schema

The system uses the following main entities:

- **Users**: Authentication and role management
- **Categories**: Product categorization
- **Suppliers**: Supplier information
- **Products**: Core inventory items
- **Transactions**: Stock movement history

## API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register (Admin only)
GET  /api/auth/profile
```

### Product Endpoints

```http
GET    /api/products              # List all products
GET    /api/products/:id          # Get product details
POST   /api/products              # Create new product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product (Admin only)
POST   /api/products/:id/adjust-stock  # Adjust stock levels
```

### Category Endpoints

```http
GET    /api/categories            # List all categories
POST   /api/categories            # Create category (Admin only)
PUT    /api/categories/:id        # Update category (Admin only)
DELETE /api/categories/:id        # Delete category (Admin only)
```

## Management Commands

After installation, use the management script:

```bash
# Start services
./manage-inventory.sh start

# Stop services
./manage-inventory.sh stop

# Restart services
./manage-inventory.sh restart

# Check status
./manage-inventory.sh status

# View logs
./manage-inventory.sh logs
```

## Security Considerations

### Default Credentials
⚠️ **Important**: Change default admin credentials immediately after installation:
- Email: `admin@inventory.com`
- Password: `admin123`

### Production Deployment
1. **Change JWT Secret**: Generate a secure JWT secret key
2. **Update Database Password**: Use a strong, unique database password
3. **Enable HTTPS**: Configure SSL/TLS certificates
4. **Firewall Rules**: Restrict database access to application servers only
5. **Regular Backups**: Implement automated database backups

## Features Overview

### Dashboard
- Real-time statistics
- Low stock alerts
- Category overview
- Total inventory value

### Product Management
- Add/edit/delete products
- SKU and barcode support
- Category assignment
- Supplier tracking
- Stock level monitoring
- Price management

### Stock Management
- Real-time stock adjustments
- Transaction history
- Reason tracking
- Bulk operations support

### User Management (Admin Only)
- Create staff accounts
- Role assignment
- User activation/deactivation

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists and user has permissions

2. **Port Already in Use**:
   - Change PORT in `.env` file
   - Kill existing processes: `sudo lsof -ti:3000 | xargs kill -9`

3. **Frontend Can't Connect to Backend**:
   - Verify backend is running on correct port
   - Check CORS configuration
   - Update API_BASE_URL in frontend

4. **Permission Denied**:
   - Check file permissions: `chmod +x scripts/install.sh`
   - Verify user has database creation privileges

### Logs

- **Application Logs**: `./manage-inventory.sh logs`
- **System Logs**: `journalctl -u inventory-backend -f`
- **Database Logs**: Check PostgreSQL logs in `/var/log/postgresql/`

## Development

### Project Structure

```
inv-manager/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication & validation
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Main server file
│   └── package.json
├── frontend/               # Web frontend
│   ├── public/
│   │   └── index.html     # Main HTML file
│   ├── src/
│   │   ├── css/           # Stylesheets
│   │   └── js/            # JavaScript
│   └── package.json
├── database/              # Database scripts
├── scripts/               # Installation scripts
├── docker-compose.yml     # Docker configuration
└── README.md
```

### Adding New Features

1. **Backend API**: Add routes in `backend/src/routes/`
2. **Database Models**: Define in `backend/src/models/`
3. **Frontend UI**: Update `frontend/public/index.html` and `frontend/src/js/app.js`
4. **Database Changes**: Create migration scripts

### Testing

```bash
# Backend tests (if added)
cd backend
npm test

# Frontend tests (if added)
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Create an issue on GitHub

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Note**: This is a production-ready inventory management system. Always follow security best practices when deploying to production environments.