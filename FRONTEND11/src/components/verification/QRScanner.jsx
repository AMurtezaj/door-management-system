import React, { useState } from 'react';
import { Container, Card, Button, Alert, Form } from 'react-bootstrap';
import { QrCodeScan, Upload } from 'react-bootstrap-icons';
import QRInstructions from './QRInstructions';

const QRScanner = () => {
  const [scannedData, setScannedData] = useState('');
  const [error, setError] = useState('');

  const handleManualInput = (e) => {
    const input = e.target.value;
    setScannedData(input);
    
    if (input.includes('/verify?data=')) {
      // Extract the data parameter from the URL
      try {
        const url = new URL(input);
        const data = url.searchParams.get('data');
        if (data) {
          // Store in localStorage and redirect
          localStorage.setItem('scannedQRData', decodeURIComponent(data));
          window.location.href = '/verify';
        }
      } catch (err) {
        setError('Invalid URL format');
      }
    } else if (input.startsWith('{') && input.endsWith('}')) {
      // Direct JSON data
      try {
        JSON.parse(input);
        localStorage.setItem('scannedQRData', input);
        window.location.href = '/verify';
      } catch (err) {
        setError('Invalid JSON format');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, just show a message that file upload QR scanning would require additional libraries
      setError('File upload QR scanning requires additional camera libraries. Please use manual input for testing.');
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white text-center">
          <h4 className="mb-0">
            <QrCodeScan className="me-2" />
            QR Code Scanner
          </h4>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <p>Scan a LindDoors invoice QR code to verify its authenticity</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Manual Input (for testing)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Paste QR code URL or JSON data here..."
                value={scannedData}
                onChange={handleManualInput}
              />
              <Form.Text className="text-muted">
                You can paste the verification URL or raw JSON data from a QR code here
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload QR Code Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <Form.Text className="text-muted">
                Upload an image containing a QR code (feature in development)
              </Form.Text>
            </Form.Group>
          </Form>

          <div className="text-center mt-4">
            <Button variant="outline-primary" href="/verify">
              <QrCodeScan className="me-2" />
              Go to Verification Page
            </Button>
          </div>

          <hr className="my-4" />

          <div className="text-center">
            <h6>How to use:</h6>
            <ol className="text-start">
              <li>Print an invoice with a QR code from the system</li>
              <li>Scan the QR code with any QR scanner app</li>
              <li>The scanner will open a verification URL in your browser</li>
              <li>View the beautiful, verified invoice details</li>
            </ol>
          </div>
        </Card.Body>
      </Card>
      
      <QRInstructions />
    </Container>
  );
};

export default QRScanner; 