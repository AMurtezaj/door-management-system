import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import AppNavbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <div className="app-layout">
      <Sidebar show={sidebarVisible} onHide={closeSidebar} />
      <AppNavbar toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <Container fluid className="p-3 p-md-4">
          <Outlet />
        </Container>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarVisible && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar} 
        />
      )}
    </div>
  );
};

export default Layout; 