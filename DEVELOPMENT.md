# Development Guide

This document provides detailed information for developers working on the Inventory Manager project.

## Getting Started

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- Git

### Quick Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tpenaflor/inv-manager.git
   cd inv-manager
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   npm run install-all
   ```

3. **Setup PostgreSQL database**:
   ```sql
   CREATE DATABASE inventory_manager;
   CREATE USER inv_user WITH PASSWORD 'dev_password';
   GRANT ALL PRIVILEGES ON DATABASE inventory_manager TO inv_user;
   ```

4. **Configure environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

5. **Initialize database**:
   ```bash
   npm run migrate
   npm run seed
   ```

6. **Start development servers**:
   ```bash
   npm run dev
   ```

## Project Architecture

### Backend (Node.js/Express)

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication, validation, etc.
│   ├── models/          # Database models (Sequelize)
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions and utilities
│   └── server.js        # Main application entry point
├── .env.example         # Environment template
├── .env                 # Local environment (git-ignored)
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies and scripts
```

### Frontend (Vanilla JS/Bootstrap)

```
frontend/
├── public/
│   └── index.html       # Main HTML file
├── src/
│   ├── css/
│   │   └── style.css    # Custom styles
│   └── js/
│       └── app.js       # Main JavaScript application
├── nginx.conf           # Nginx configuration for Docker
├── Dockerfile           # Docker configuration
└── package.json         # Scripts and metadata
```

## Database Design

### Entity Relationships

```
Users (1) ----< (Many) Transactions
Categories (1) ----< (Many) Products
Suppliers (1) ----< (Many) Products  
Products (1) ----< (Many) Transactions
```

### Key Models

1. **User**
   - id, email, password, firstName, lastName, role, isActive
   - Roles: 'admin', 'staff'

2. **Category**
   - id, name, description, isActive

3. **Supplier**
   - id, name, email, phone, address, contactPerson, isActive

4. **Product**
   - id, name, description, sku, barcode, price, cost
   - stockQuantity, minStockLevel, maxStockLevel, unit, location
   - categoryId (FK), supplierId (FK), isActive

5. **Transaction**
   - id, type, quantity, previousStock, newStock, reason, notes, reference
   - productId (FK), userId (FK)
   - Types: 'in', 'out', 'adjustment'

## API Design

### Authentication

All API endpoints except `/auth/login` require JWT authentication via `Authorization: Bearer <token>` header.

### Error Handling

Standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

Error Response Format:
```json
{
  "error": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ]
}
```

### Pagination

List endpoints support pagination:
```
GET /api/products?page=1&limit=10
```

Response format:
```json
{
  "products": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## Development Workflow

### Code Style

- Use ES6+ features
- Follow camelCase naming convention
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

Currently no tests are implemented. To add testing:

1. **Backend Testing**:
   ```bash
   cd backend
   npm install --save-dev jest supertest
   ```

2. **Frontend Testing**:
   ```bash
   cd frontend
   npm install --save-dev jest jsdom
   ```

### Adding New Features

#### Backend

1. **Add Model** (if needed):
   ```javascript
   // backend/src/models/NewModel.js
   const { DataTypes } = require('sequelize');
   const sequelize = require('../config/database');

   const NewModel = sequelize.define('NewModel', {
     // Define fields
   });

   module.exports = NewModel;
   ```

2. **Add Controller**:
   ```javascript
   // backend/src/controllers/newController.js
   const { NewModel } = require('../models');

   const getItems = async (req, res) => {
     // Implementation
   };

   module.exports = { getItems };
   ```

3. **Add Routes**:
   ```javascript
   // backend/src/routes/new.js
   const express = require('express');
   const { getItems } = require('../controllers/newController');
   const { auth } = require('../middleware/auth');

   const router = express.Router();
   router.get('/', auth, getItems);

   module.exports = router;
   ```

4. **Register Routes**:
   ```javascript
   // backend/src/server.js
   const newRoutes = require('./routes/new');
   app.use('/api/new', newRoutes);
   ```

#### Frontend

1. **Add HTML** to `public/index.html`
2. **Add JavaScript** functions to `src/js/app.js`
3. **Add CSS** styles to `src/css/style.css`

### Database Changes

1. **Create Migration Script**:
   ```javascript
   // backend/src/utils/migrations/001_add_new_field.js
   const { sequelize } = require('../models');

   const migrate = async () => {
     await sequelize.query('ALTER TABLE products ADD COLUMN new_field VARCHAR(255)');
   };

   migrate();
   ```

2. **Update Model** to reflect schema changes

3. **Update Seed Data** if necessary

### Environment Configuration

Development vs Production differences:

```javascript
// Development
{
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  JWT_SECRET: 'dev_secret'
}

// Production
{
  NODE_ENV: 'production',
  DB_HOST: 'production-db-host',
  JWT_SECRET: 'secure_random_secret'
}
```

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (cost factor: 12)
- JWT tokens with secure secret
- Token expiration (7 days default)

### Authorization
- Role-based access control
- Route-level protection
- Resource-level permissions

### Input Validation
- express-validator for request validation
- Sequelize model validation
- Client-side validation for UX

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting

## Performance Optimization

### Database
- Proper indexes on frequently queried fields
- Connection pooling
- Query optimization

### API
- Pagination for large datasets
- Selective field loading
- Caching strategies (future enhancement)

### Frontend
- Minimize DOM manipulations
- Debounce search inputs
- Lazy loading for large lists

## Debugging

### Backend Debugging

1. **Enable Debug Logs**:
   ```javascript
   // Set NODE_ENV=development in .env
   console.log('Debug info:', data);
   ```

2. **Database Queries**:
   ```javascript
   // Enable query logging in database.js
   logging: console.log
   ```

3. **API Testing**:
   ```bash
   # Test endpoints with curl
   curl -X GET http://localhost:3000/api/products \
     -H "Authorization: Bearer <token>"
   ```

### Frontend Debugging

1. **Browser DevTools**:
   - Console for JavaScript errors
   - Network tab for API calls
   - Elements tab for DOM inspection

2. **API Response Logging**:
   ```javascript
   // Add to app.js
   console.log('API Response:', response);
   ```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run start
```

### Docker
```bash
docker-compose up -d
```

## Contributing

1. Create feature branch from `main`
2. Make changes with proper commit messages
3. Test your changes thoroughly
4. Submit pull request with description

### Commit Message Format
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Examples:
- feat(auth): add password reset functionality
- fix(products): resolve stock calculation bug
- docs(api): update endpoint documentation
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check PostgreSQL service is running
   - Verify credentials in .env
   - Check network connectivity

2. **JWT Errors**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper header format

3. **Frontend API Calls Fail**:
   - Check backend is running
   - Verify CORS configuration
   - Check browser network tab for errors

4. **Permission Denied**:
   - Check user role assignments
   - Verify middleware is properly applied
   - Check route protection

### Logs

- **Backend**: Console output or log files
- **Database**: PostgreSQL logs
- **Frontend**: Browser console

## Future Enhancements

### High Priority
- [ ] Comprehensive test suite
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Data export functionality
- [ ] Barcode scanning support

### Medium Priority
- [ ] Multi-location support
- [ ] Purchase order management
- [ ] Supplier integration
- [ ] Advanced reporting

### Low Priority
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support