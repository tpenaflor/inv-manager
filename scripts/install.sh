#!/bin/bash

# Inventory Manager Installation Script
# This script sets up the complete inventory management system

set -e  # Exit on any error

echo "================================================"
echo "Inventory Manager Installation Script"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if script is run as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
print_status "Checking system requirements..."

# Check for required commands
REQUIRED_COMMANDS=("curl" "wget" "git")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists $cmd; then
        print_error "$cmd is required but not installed"
        exit 1
    fi
done

print_success "System requirements check passed"

# Install Node.js if not present
if ! command_exists node; then
    print_status "Node.js not found. Installing Node.js..."
    
    # Download and install Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js is already installed: $NODE_VERSION"
fi

# Install PostgreSQL if not present
if ! command_exists psql; then
    print_status "PostgreSQL not found. Installing PostgreSQL..."
    
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    print_success "PostgreSQL installed successfully"
else
    print_status "PostgreSQL is already installed"
fi

# Create PostgreSQL database and user
print_status "Setting up database..."

# Generate random password if not provided
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    print_warning "Generated random database password: $DB_PASSWORD"
fi

# Database configuration
DB_NAME="inventory_manager"
DB_USER="inv_user"
DB_HOST="localhost"
DB_PORT="5432"

# Create database and user
sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

print_success "Database setup completed"

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

# Install frontend dependencies (if any were added)
print_status "Setting up frontend..."
cd ../frontend
# Frontend uses CDN resources, so no npm install needed
print_success "Frontend setup completed"

cd ..

# Create environment file
print_status "Creating environment configuration..."

cat > backend/.env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3001

# Admin User (for initial setup)
ADMIN_EMAIL=admin@inventory.com
ADMIN_PASSWORD=admin123
EOF

print_success "Environment configuration created"

# Run database migrations
print_status "Running database migrations..."
cd backend
npm run migrate
print_success "Database migrations completed"

# Seed initial data
print_status "Seeding initial data..."
npm run seed
print_success "Initial data seeded"

cd ..

# Create systemd service files for production
print_status "Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/inventory-backend.service > /dev/null << EOF
[Unit]
Description=Inventory Manager Backend
Documentation=https://github.com/tpenaflor/inv-manager
After=network.target postgresql.service

[Service]
Environment=NODE_ENV=production
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (simple HTTP server)
sudo tee /etc/systemd/system/inventory-frontend.service > /dev/null << EOF
[Unit]
Description=Inventory Manager Frontend
Documentation=https://github.com/tpenaflor/inv-manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/frontend
ExecStart=/usr/bin/python3 -m http.server 3001 --directory public
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable inventory-backend.service
sudo systemctl enable inventory-frontend.service

print_success "Systemd services created and enabled"

# Create management script
print_status "Creating management script..."

cat > manage-inventory.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Starting Inventory Manager..."
        sudo systemctl start inventory-backend
        sudo systemctl start inventory-frontend
        echo "Services started successfully"
        echo "Backend: http://localhost:3000"
        echo "Frontend: http://localhost:3001"
        ;;
    stop)
        echo "Stopping Inventory Manager..."
        sudo systemctl stop inventory-backend
        sudo systemctl stop inventory-frontend
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting Inventory Manager..."
        sudo systemctl restart inventory-backend
        sudo systemctl restart inventory-frontend
        echo "Services restarted"
        ;;
    status)
        echo "Inventory Manager Status:"
        echo "Backend:"
        sudo systemctl status inventory-backend --no-pager -l
        echo ""
        echo "Frontend:"
        sudo systemctl status inventory-frontend --no-pager -l
        ;;
    logs)
        echo "Recent logs:"
        echo "Backend logs:"
        sudo journalctl -u inventory-backend -n 20 --no-pager
        echo ""
        echo "Frontend logs:"
        sudo journalctl -u inventory-frontend -n 20 --no-pager
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the inventory manager services"
        echo "  stop    - Stop the inventory manager services"
        echo "  restart - Restart the inventory manager services"
        echo "  status  - Show service status"
        echo "  logs    - Show recent service logs"
        exit 1
        ;;
esac

exit 0
EOF

chmod +x manage-inventory.sh

print_success "Management script created"

# Start services
print_status "Starting services..."
sudo systemctl start inventory-backend
sudo systemctl start inventory-frontend

# Wait a moment for services to start
sleep 3

# Check if services are running
if sudo systemctl is-active --quiet inventory-backend && sudo systemctl is-active --quiet inventory-frontend; then
    print_success "All services are running successfully!"
else
    print_warning "Some services may not have started properly. Check status with: ./manage-inventory.sh status"
fi

echo ""
echo "================================================"
echo "Installation completed successfully!"
echo "================================================"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:3001"
echo "  Backend API: http://localhost:3000"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@inventory.com"
echo "  Password: admin123"
echo ""
echo "Management commands:"
echo "  Start:   ./manage-inventory.sh start"
echo "  Stop:    ./manage-inventory.sh stop"
echo "  Restart: ./manage-inventory.sh restart"
echo "  Status:  ./manage-inventory.sh status"
echo "  Logs:    ./manage-inventory.sh logs"
echo ""
echo "Database connection details saved in: backend/.env"
echo "Database password: $DB_PASSWORD"
echo ""
print_warning "Please change the default admin password after first login!"
echo "================================================"