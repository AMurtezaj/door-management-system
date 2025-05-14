import React, { useState } from 'react';
import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { List, Bell, Person, BoxArrowRight, Gear } from 'react-bootstrap-icons';
import NotificationBadge from '../notifications/NotificationBadge';
import './Navbar.css';

const AppNavbar = ({ toggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="white" expand="lg" className="app-navbar shadow-sm">
      <Container fluid>
        <Button 
          variant="link" 
          className="sidebar-toggle p-0 me-3 border-0"
          onClick={toggleSidebar}
        >
          <List size={24} />
        </Button>
        
        <Navbar.Brand as={Link} to="/" className="me-auto">
          <img 
            src="/door-icon.svg" 
            width="30" 
            height="30" 
            className="d-inline-block align-top me-2" 
            alt="Door Management System"
          />
          Door Management System
        </Navbar.Brand>
        
        <Nav className="ms-auto d-flex align-items-center">
          <NotificationBadge />
          
          <Dropdown 
            align="end"
            show={showUserDropdown}
            onToggle={(isOpen) => setShowUserDropdown(isOpen)}
          >
            <Dropdown.Toggle 
              as="div"
              id="user-dropdown"
              className="user-dropdown"
            >
              <div className="user-avatar d-flex align-items-center">
                <div className="avatar-circle-sm">
                  {user?.emri?.charAt(0)}{user?.mbiemri?.charAt(0)}
                </div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-lg border-0">
              <Dropdown.Header>
                <div className="fw-bold">{user?.emri} {user?.mbiemri}</div>
                <div className="text-muted small">{user?.email}</div>
              </Dropdown.Header>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/profile">
                <Person className="me-2" size={16} />
                My Profile
              </Dropdown.Item>
              {isAdmin && (
                <Dropdown.Item as={Link} to="/settings">
                  <Gear className="me-2" size={16} />
                  Settings
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <BoxArrowRight className="me-2" size={16} />
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