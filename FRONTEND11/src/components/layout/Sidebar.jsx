import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import {
  HouseDoorFill,
  DoorClosed,
  People,
  Bell,
  Gear,
  ClockHistory,
  ShieldLock,
  Person
} from 'react-bootstrap-icons';
import './Sidebar.css';

const Sidebar = ({ show, onHide }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  // Navigation items with role-based access
  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: <HouseDoorFill size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/doors', 
      label: 'Doors', 
      icon: <DoorClosed size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    {
      path: '/profile',
      label: 'My Profile',
      icon: <Person size={20} />,
      roles: ['admin', 'menaxher']
    },
    { 
      path: '/access', 
      label: 'Access Control', 
      icon: <ShieldLock size={20} />, 
      roles: ['admin'] 
    },
    { 
      path: '/users', 
      label: 'User Management', 
      icon: <People size={20} />, 
      roles: ['admin'] 
    },
    { 
      path: '/logs', 
      label: 'Activity Logs', 
      icon: <ClockHistory size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: <Bell size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: <Gear size={20} />, 
      roles: ['admin'] 
    }
  ];
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.roli || '')
  );

  return (
    <div className={`sidebar bg-dark text-white ${show ? 'show' : ''}`}>
      <div className="sidebar-header p-3 d-flex align-items-center justify-content-center border-bottom">
        <h4 className="m-0">Door Management</h4>
      </div>
      
      <div className="sidebar-user p-3 text-center border-bottom">
        <div className="user-avatar mb-2">
          <div className="avatar-circle">
            {user?.emri?.charAt(0)}{user?.mbiemri?.charAt(0)}
          </div>
        </div>
        <h6 className="mb-0">{user?.emri} {user?.mbiemri}</h6>
        <small className="text-muted">{user?.roli}</small>
      </div>
      
      <Nav className="flex-column p-3">
        {filteredNavItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link 
              as={Link} 
              to={item.path}
              className={`nav-link py-2 px-3 d-flex align-items-center ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onHide}
            >
              <span className="me-3">{item.icon}</span>
              {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      
      <div className="sidebar-footer p-3 mt-auto border-top">
        <div className="d-flex align-items-center">
          <small className="text-muted">
            &copy; {new Date().getFullYear()} Door Management System
          </small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 