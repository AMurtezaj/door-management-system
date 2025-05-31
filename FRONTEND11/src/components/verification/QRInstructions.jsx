import React from 'react';
import { Card, Alert, Badge, Row, Col } from 'react-bootstrap';
import { 
  QrCodeScan, 
  Phone, 
  Wifi, 
  CheckCircle, 
  ExclamationTriangle,
  Globe
} from 'react-bootstrap-icons';

const QRInstructions = () => {
  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header className="bg-info text-white">
        <h5 className="mb-0">
          <QrCodeScan className="me-2" />
          QR Code Usage Instructions
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <h6 className="text-success">
              <CheckCircle className="me-2" />
              How to Scan QR Codes
            </h6>
            <ol>
              <li>Open your phone's camera or QR scanner app</li>
              <li>Point the camera at the QR code on the invoice</li>
              <li>Tap the notification that appears</li>
              <li>View the beautiful verification page</li>
            </ol>
            
            <Alert variant="success" className="mt-3">
              <strong>✅ Expected Behavior:</strong><br />
              The QR code should open a verification page showing all invoice details in a professional format.
            </Alert>
          </Col>
          
          <Col md={6}>
            <h6 className="text-warning">
              <ExclamationTriangle className="me-2" />
              Troubleshooting
            </h6>
            
            <Alert variant="warning" className="mb-3">
              <strong><Phone className="me-1" /> Development Mode:</strong><br />
              If you see "localhost" or connection errors, make sure:
              <ul className="mt-2 mb-0">
                <li>Your phone is on the same WiFi network</li>
                <li>The development server is running with <code>--host</code> flag</li>
                <li>The IP address in the code matches your computer's IP</li>
              </ul>
            </Alert>
            
            <Alert variant="info">
              <strong><Globe className="me-1" /> Production Mode:</strong><br />
              In production, QR codes will contain your actual domain URL and work from anywhere.
            </Alert>
          </Col>
        </Row>
        
        <hr />
        
        <Row>
          <Col md={12}>
            <h6>QR Code URLs in Different Environments:</h6>
            
            <Alert variant="warning" className="mb-2">
              <strong>🔧 Development (Current):</strong><br />
              <code>http://192.168.0.104:5173/verify?data=...</code><br />
              <small>Only works on your local WiFi network</small>
            </Alert>
            
            <Alert variant="success" className="mb-3">
              <strong>🌐 Production (When Deployed):</strong><br />
              <code>https://yourdomain.com/verify?data=...</code><br />
              <small>Works from anywhere in the world! ✨</small>
            </Alert>
            
            <h6>Current Configuration:</h6>
            <div className="d-flex flex-wrap gap-2">
              <Badge bg="primary">
                <Wifi className="me-1" />
                Development IP: 192.168.0.104:5173
              </Badge>
              <Badge bg="success">
                <CheckCircle className="me-1" />
                Mobile Compatible
              </Badge>
              <Badge bg="info">
                <QrCodeScan className="me-1" />
                High Error Correction
              </Badge>
            </div>
            
            <div className="mt-3 small text-muted">
              <strong>Note:</strong> To change the development IP address, update the QR_CONFIG object in OrderInvoice.jsx
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default QRInstructions; 