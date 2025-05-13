# Door Management System

A complete system for managing garage door sales, manufacturing capacity, payments, and debts.

## Features

### Order Management

- **Daily Capacity Management**: Set daily quotas for different product types (garage doors and lids)
- **Order Tracking**: Monitor orders by status (pending, in progress, completed, debt)
- **Measurement Status**: Track if orders have been measured
- **Print with Security Stamps**: Print orders with security stamps/seals
- **Notifications**: Get alerts for orders that need attention

### Debt Management

- **Separate Debt Tracking**: View debts by payment method (cash or bank)
- **Admin-only Actions**: Only admins can delete or modify payments
- **Payment Processing**: Record and manage customer payments

### Role-based Access Control

- **Admin Users**: Full system access
- **Manager Users**: Limited to order entry and viewing capacities

## System Architecture

### Backend (Node.js + PostgreSQL)

- **Models**:
  - User: Admin and Manager accounts
  - Order: Customer order tracking
  - Payment: Payment management
  - DailyCapacity: Daily production capacity settings
  - Notification: System alerts

- **Controllers**: 
  - Handle business logic
  - Enforce role-based permissions
  - Process requests from frontend
  
- **Authentication**: 
  - JWT token-based auth
  - Role-based middleware

### Frontend (React + Material UI)

- **Key Pages**:
  - Dashboard: Overview of system metrics
  - Orders: Manage all orders
  - Capacity: View and set daily capacities
  - Debts: Manage unpaid orders
  - Payments: Process customer payments
  - Notifications: System alerts
  
- **Components**:
  - DailyCapacityView: View daily capacity limits
  - OrderForm: Create and edit orders
  - MeasurementStatusDropdown: Track measurement status
  - CapacityNotifications: Get capacity alerts
  
## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/door-management-system.git
cd door-management-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
Create a `.env` file in the backend directory with the following:
```
PORT=5000
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=door_system
DB_PORT=5432
```

5. Start the development servers:
```bash
# In /backend
npm run dev

# In /frontend
npm run dev
```

## License

This project is licensed under the MIT License. 