import React, { useState } from 'react';
import { Navbar, Container, Nav, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  List, 
  Bell, 
  Person, 
  BoxArrowRight, 
  Gear,
  House,
  Shield
} from 'react-bootstrap-icons';
import NotificationBadge from '../notifications/NotificationBadge';
import './Navbar.css';

const AppNavbar = ({ toggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar className="app-navbar modern-navbar">
      <Container fluid>
        <Button 
          variant="link" 
          className="sidebar-toggle modern-toggle"
          onClick={toggleSidebar}
        >
          <List size={20} />
        </Button>
        
        <Navbar.Brand as={Link} to="/" className="modern-brand">
          <div className="brand-container">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="navLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFC107" />
                    <stop offset="50%" stopColor="#FF9800" />
                    <stop offset="100%" stopColor="#F44336" />
                  </linearGradient>
                </defs>
                
                <path 
                  d="M20 15 L20 70 L75 70 L75 85 L5 85 L5 15 Z" 
                  fill="url(#navLogoGradient)"
                />
                
                <path 
                  d="M50 15 L95 15 L95 45 L75 45 L75 30 L50 30 Z" 
                  fill="url(#navLogoGradient)"
                  opacity="0.9"
                />
                
                <path 
                  d="M75 45 L95 45 L95 70 L75 70 Z" 
                  fill="url(#navLogoGradient)"
                  opacity="0.8"
                />
              </svg>
            </div>
            <span className="brand-text">Sistemi i Porosive</span>
          </div>
        </Navbar.Brand>
        
        <Nav className="ms-auto d-flex align-items-center">
          <div className="notification-container me-3">
            <NotificationBadge />
          </div>
          
          <Dropdown 
            align="end"
            show={showUserDropdown}
            onToggle={(isOpen) => setShowUserDropdown(isOpen)}
          >
            <Dropdown.Toggle 
              as="div"
              id="user-dropdown"
              className="user-dropdown-modern"
            >
              <div className="user-avatar-modern">
                {user?.emri?.charAt(0)}{user?.mbiemri?.charAt(0)}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="modern-dropdown-menu">
              <div className="dropdown-header-modern">
                <div className="user-avatar-large">
                  {user?.emri?.charAt(0)}{user?.mbiemri?.charAt(0)}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.emri} {user?.mbiemri}</div>
                  <div className="user-email">{user?.email}</div>
                  <div className="user-role-large">
                    {isAdmin ? (
                      <Badge bg="secondary" className="role-badge">
                        <Shield size={12} className="me-1" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge bg="light" text="dark" className="role-badge">
                        <Person size={12} className="me-1" />
                        User
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Dropdown.Divider className="modern-divider" />
              
              <Dropdown.Item as={Link} to="/profile" className="modern-dropdown-item">
                <Person className="me-3" size={16} />
                My Profile
              </Dropdown.Item>
              
              {isAdmin && (
                <Dropdown.Item as={Link} to="/settings" className="modern-dropdown-item">
                  <Gear className="me-3" size={16} />
                  Settings
                </Dropdown.Item>
              )}
              
              <Dropdown.Divider className="modern-divider" />
              
              <Dropdown.Item onClick={handleLogout} className="modern-dropdown-item logout-item">
                <BoxArrowRight className="me-3" size={16} />
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default AppNavbar; 