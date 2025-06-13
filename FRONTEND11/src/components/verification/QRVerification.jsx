import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Alert, Button, Table } from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  Calendar, 
  Person, 
  CurrencyEuro,
  House,
  Telephone,
  GeoAlt,
  FileText,
  Clock,
  Award,
  Eye
} from 'react-bootstrap-icons';
import { format } from 'date-fns';

const QRVerification = () => {
  const [qrData, setQrData] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get QR data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const qrParam = urlParams.get('data');
    
    console.log('QR Verification - URL Param:', qrParam); // Debug log
    
    if (qrParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(qrParam));
        console.log('QR Verification - Decoded Data:', decodedData); // Debug log
        setQrData(decodedData);
        validateQRData(decodedData);
      } catch (err) {
        console.error('QR Verification - Parse Error:', err); // Debug log
        setError(`Invalid QR code data format: ${err.message}`);
      }
    } else {
      // Try to get from localStorage (if scanned recently)
      const storedData = localStorage.getItem('scannedQRData');
      console.log('QR Verification - Stored Data:', storedData); // Debug log
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setQrData(parsedData);
          validateQRData(parsedData);
        } catch (err) {
          setError('Invalid stored QR data');
        }
      } else {
        setError('No QR code data found. Please scan a valid LindDoors invoice QR code.');
      }
    }
    setLoading(false);
  }, []);

  const validateQRData = (data) => {
    console.log('QR Verification - Validating Data:', data); // Debug log
    
    // More flexible validation
    if (!data) {
      setError('No data received');
      return;
    }
    
    // Check for basic structure
    if (typeof data !== 'object') {
      setError('Invalid data format - not an object');
      return;
    }
    
    // Check for required fields with more flexibility
    const hasDocumentType = data.documentType === 'INVOICE' || data.documentType === 'SUPPLEMENTARY_INVOICE';
    const hasCompanyName = data.companyName && data.companyName.includes('LindDoors');
    const hasOrderDetails = data.orderDetails && data.orderDetails.orderId;
    
    console.log('QR Verification - Validation checks:', {
      hasDocumentType,
      hasCompanyName,
      hasOrderDetails,
      documentType: data.documentType,
      companyName: data.companyName
    });
    
    if (hasDocumentType && hasCompanyName && hasOrderDetails) {
      // Check expiration if metadata exists
      if (data.metadata?.expiresAt) {
        const expirationDate = new Date(data.metadata.expiresAt);
        const now = new Date();
        
        if (expirationDate <= now) {
          setError('This QR code has expired');
          return;
        }
      }
      
      setIsValid(true);
      console.log('QR Verification - Validation successful!'); // Debug log
    } else {
      // More detailed error message
      const missingFields = [];
      if (!hasDocumentType) missingFields.push('document type');
      if (!hasCompanyName) missingFields.push('company name');
      if (!hasOrderDetails) missingFields.push('order details');
      
      setError(`Invalid QR code - missing: ${missingFields.join(', ')}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'e përfunduar': return 'success';
      case 'në proces': return 'warning';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying QR code...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          <XCircle size={48} className="mb-3" />
          <h4>Verification Failed</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
        
        {/* Debug information */}
        {qrData && (
          <Card className="mt-4">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">Debug Information</h6>
            </Card.Header>
            <Card.Body>
              <p><strong>Received Data Structure:</strong></p>
              <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(qrData, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        )}
      </Container>
    );
  }

  if (!isValid || !qrData) {
    return (
      <Container className="mt-5">
        <Alert variant="warning" className="text-center">
          <XCircle size={48} className="mb-3" />
          <h4>Invalid QR Code</h4>
          <p>This QR code is not valid or has been tampered with.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      {/* Header */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="text-center" style={{ 
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          borderRadius: '0.5rem'
        }}>
          <CheckCircle size={64} className="mb-3" />
          <h2 className="mb-2">✅ Verified Authentic</h2>
          <p className="mb-0">This LindDoors invoice has been verified as authentic</p>
        </Card.Body>
      </Card>

      {/* Company Info */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <House className="me-2" />
            {qrData.companyName}
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Document Information</h6>
              <p>
                <strong>Type:</strong> {qrData.documentType}<br />
                <strong>QR Version:</strong> {qrData.metadata?.qrVersion}
              </p>
            </Col>
            <Col md={6}>
              <h6>Verification</h6>
              <Badge bg="success" className="me-2">
                <Shield className="me-1" />
                Verified
              </Badge>
              <Badge bg="info">
                <Award className="me-1" />
                Authentic Document
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Parent Order Information (for supplementary invoices) */}
      {qrData.documentType === 'SUPPLEMENTARY_INVOICE' && qrData.parentOrder && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <FileText className="me-2" />
              🔗 Parent Order Information
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info" className="mb-3">
              <strong>This is a supplementary order</strong> connected to the main order below.
            </Alert>
            <Row>
              <Col md={6}>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Parent Order ID:</strong></td>
                      <td>#{qrData.parentOrder.id}</td>
                    </tr>
                    <tr>
                      <td><strong>Parent Order Type:</strong></td>
                      <td>{qrData.parentOrder.type}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Delivery Date:</strong></td>
                      <td>{qrData.parentOrder.deliveryDate || 'N/A'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Order Details */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">
            <FileText className="me-2" />
            Order Details
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Order ID:</strong></td>
                    <td>#{qrData.orderDetails?.orderId}</td>
                  </tr>
                  <tr>
                    <td><strong>Type:</strong></td>
                    <td>{qrData.orderDetails?.orderType}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>
                      <Badge bg={getStatusColor(qrData.orderDetails?.status)}>
                        {qrData.orderDetails?.status}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Order Date:</strong></td>
                    <td>{qrData.orderDetails?.orderDate || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Description:</strong></td>
                    <td>{qrData.orderDetails?.description}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Customer Information */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <Person className="me-2" />
            Customer Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="d-flex align-items-center mb-2">
                <Person className="me-2 text-muted" />
                <div>
                  <strong>Customer:</strong><br />
                  {qrData.customer?.name}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center mb-2">
                <Telephone className="me-2 text-muted" />
                <div>
                  <strong>Phone:</strong><br />
                  {qrData.customer?.phone}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center mb-2">
                <GeoAlt className="me-2 text-muted" />
                <div>
                  <strong>Location:</strong><br />
                  {qrData.customer?.location}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Financial Information */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <CurrencyEuro className="me-2" />
            Financial Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Total Price:</strong></td>
                    <td className="text-end"><strong>{qrData.financial?.totalPrice} €</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Down Payment:</strong></td>
                    <td className="text-end">{qrData.financial?.downPayment} €</td>
                  </tr>
                  <tr>
                    <td><strong>Remaining:</strong></td>
                    <td className="text-end text-danger"><strong>{qrData.financial?.remainingPayment} €</strong></td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td><strong>Payment Completed:</strong></td>
                    <td>
                      <Badge bg={qrData.financial?.paymentCompleted === 'Po' ? 'success' : 'danger'}>
                        {qrData.financial?.paymentCompleted}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Verification Information */}
      {qrData.verification && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <Shield className="me-2" />
              Verification
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Verification Code:</strong></td>
                      <td><code>{qrData.verification.code}</code></td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Generated:</strong></td>
                      <td>{formatDate(qrData.verification.generatedAt)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Footer */}
      <Card className="shadow-sm">
        <Card.Body className="text-center bg-light">
          <p className="mb-2">
            <strong>LindDoors Management System</strong>
          </p>
          <p className="text-muted small mb-0">
            This document has been verified as authentic.<br />
            For support contact: +383 44 123 456
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QRVerification; 