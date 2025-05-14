# Door Management System

A comprehensive web application for managing door orders, capacity planning, and customer management for a door manufacturing company.

## Features

- **Order Management**: Create, track, and manage door orders with detailed information
- **Capacity Planning**: Plan production capacity for different door types by day
- **User Management**: Admin tools for managing system users with different permission levels
- **Dashboard**: Real-time analytics and reports for business insights
- **Notification System**: Automated alerts for important events

## Tech Stack

### Frontend
- React.js
- Material UI
- React Router
- React Query
- Recharts for data visualization
- date-fns for date manipulation

### Backend
- Node.js with Express
- MySQL/PostgreSQL database
- JWT for authentication
- Sequelize ORM

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MySQL/PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/door-management-system.git
cd door-management-system
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
```bash
# In the backend directory, create a .env file with the following variables
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=door_management
JWT_SECRET=your_jwt_secret
PORT=3001

# In the frontend directory, create a .env file with:
REACT_APP_API_URL=http://localhost:3001/api
```

4. Initialize the database
```bash
cd backend
npm run db:create
npm run db:migrate
npm run db:seed  # Optional: add sample data
```

5. Start the development servers
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Usage

### Default Admin Account
- Email: admin@doors.com
- Password: admin123

### Main Modules
1. **Orders**: Create and manage customer door orders
2. **Capacity**: Set and monitor production capacity
3. **Users**: Manage system users (admin only)
4. **Dashboard**: Overview of key metrics and status
5. **Notifications**: System alerts and notifications

## Development

### Code Structure
- `/frontend`: React-based frontend application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Page components for different routes
  - `/src/services`: API service integrations
  - `/src/context`: React context providers
  
- `/backend`: Node.js/Express backend
  - `/controllers`: Business logic
  - `/models`: Database models
  - `/routes`: API route definitions
  - `/middleware`: Custom middleware
  - `/config`: Configuration files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material UI team for the excellent component library
- React Query for simplified data fetching
- All contributors who have helped improve this system 