import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import LindiDoorsLogo from '../components/common/LindiDoorsLogo';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/');
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      // No need to navigate here as the useEffect will handle that
    } catch (error) {
      setErrors({ form: error.message || 'Invalid email or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page vh-100 d-flex align-items-center justify-content-center">
      <Container fluid className="position-relative" style={{ zIndex: 2 }}>
        <Row className="justify-content-center w-100">
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card className={`login-card shadow-lg border-0 rounded-lg ${errors.form ? 'login-error' : ''}`}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center mb-3 logo-container-login">
                    <LindiDoorsLogo 
                      size={60} 
                      showText={true} 
                      textSize="large"
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                  </div>
                  <h2 className="mt-3 fw-bold" style={{ color: '#212529' }}>
                    Door Management System
                  </h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>
                
                {errors.form && (
                  <Alert variant="danger" className="mb-4">
                    {errors.form}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#495057', fontWeight: 600 }}>
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      isInvalid={!!errors.email}
                      disabled={isSubmitting}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                        fontSize: '1rem'
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: '#495057', fontWeight: 600 }}>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      isInvalid={!!errors.password}
                      disabled={isSubmitting}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px',
                        fontSize: '1rem'
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Button 
                    type="submit" 
                    className={`login-btn w-100 py-3 ${isSubmitting ? 'login-loading' : ''}`}
                    disabled={isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #212529 0%, #495057 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(33, 37, 41, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(33, 37, 41, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(33, 37, 41, 0.3)';
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Signing in...
                      </>
                    ) : 'Sign In'}
                  </Button>
                </Form>
                
                {/* Footer */}
                <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                  <small className="text-muted d-block mb-3">
                    &copy; {new Date().getFullYear()} Lindi Doors Management System
                  </small>
                  <div className="developer-credit-login-enhanced">
                    <div className="credit-card-login">
                      <div className="credit-line-login">
                        <span className="credit-text-login">Powered by </span>
                        <strong className="brand-name-login">LindiDoors</strong>
                      </div>
                      <div className="credit-line-login">
                        <span className="credit-text-login">Developed by </span>
                        <strong className="developer-name-login">Altin Murtezaj</strong>
                        <span className="developer-title-login">(Software Engineer)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage; 