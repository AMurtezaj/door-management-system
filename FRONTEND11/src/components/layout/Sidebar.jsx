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
  Rulers,
  PlusSquare,
  List,
  Clock
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
      path: '/orders/measurement', 
      label: 'Filloj me Matje', 
      icon: <Rulers size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/orders/incomplete', 
      label: 'Porositë e Pakompletara', 
      icon: <Clock size={20} />, 
      roles: ['admin', 'menaxher'] 
    },
    { 
      path: '/orders/additional', 
      label: 'Porositë Shtesë', 
      icon: <PlusSquare size={20} />, 
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
        <Link to="/" className="logo-link" onClick={onHide}>
          <div className="logo-container">
            {/* Lindi Doors Logo */}
            <div className="logo-icon">
              <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Geometric L shape with gradient */}
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFC107" />
                    <stop offset="50%" stopColor="#FF9800" />
                    <stop offset="100%" stopColor="#F44336" />
                  </linearGradient>
                </defs>
                
                {/* Main L shape */}
                <path 
                  d="M20 15 L20 70 L75 70 L75 85 L5 85 L5 15 Z" 
                  fill="url(#logoGradient)"
                />
                
                {/* Top accent piece */}
                <path 
                  d="M50 15 L95 15 L95 45 L75 45 L75 30 L50 30 Z" 
                  fill="url(#logoGradient)"
                  opacity="0.9"
                />
                
                {/* Right accent piece */}
                <path 
                  d="M75 45 L95 45 L95 70 L75 70 Z" 
                  fill="url(#logoGradient)"
                  opacity="0.8"
                />
              </svg>
            </div>
            <div className="logo-text">
              <div className="brand-name">LINDI</div>
              <div className="brand-subtitle">DOORS</div>
            </div>
          </div>
        </Link>
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
        <div className="d-flex flex-column align-items-center">
          <small className="text-muted mb-3">
            &copy; {new Date().getFullYear()} Sistemi i Porosive
          </small>
          <div className="developer-credit-enhanced">
            <div className="credit-card">
              <div className="credit-line">
                <span className="credit-text">Powered by </span>
                <strong className="brand-name">LindiDoors</strong>
              </div>
              <div className="credit-line">
                <span className="credit-text">Developed by </span>
                <strong className="developer-name">Altin Murtezaj</strong>
                <span className="developer-title">(Software Engineer)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 