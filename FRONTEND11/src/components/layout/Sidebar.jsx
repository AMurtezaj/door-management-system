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
  Person,
  Cart,
  Calendar3,
  CurrencyExchange,
  Rulers
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
      path: '/orders', 
      label: 'Porositë', 
      icon: <Cart size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/orders/capacity', 
      label: 'Kapacitetet', 
      icon: <Calendar3 size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    {
      path: '/debt-management',
      label: 'Menaxhimi i Borxheve',
      icon: <CurrencyExchange size={20} />,
      roles: ['admin', 'menaxher']
    },
    {
      path: '/measurement-status',
      label: 'Statusi i Matjeve',
      icon: <Rulers size={20} />,
      roles: ['admin', 'menaxher']
    },
    {
      path: '/profile',
      label: 'Profili Im',
      icon: <Person size={20} />,
      roles: ['admin', 'menaxher']
    },
    { 
      path: '/users', 
      label: 'Menaxhimi i Përdoruesve', 
      icon: <People size={20} />, 
      roles: ['admin'] 
    },
    { 
      path: '/notifications', 
      label: 'Njoftimet', 
      icon: <Bell size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
  ];
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.roli || '')
  );

  return (
    <div className={`sidebar bg-dark text-white ${show ? 'show' : ''}`}>
      <div className="sidebar-header p-3 d-flex align-items-center justify-content-center border-bottom">
        <h4 className="m-0">LindiDoors Management</h4>
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
            &copy; {new Date().getFullYear()} Sistemi i Porosive
          </small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 