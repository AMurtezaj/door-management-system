import React, { useState } from 'react';
import { Container, Card, Button, Alert, Form, Badge } from 'react-bootstrap';
import { Bug, CheckCircle, XCircle } from 'react-bootstrap-icons';

const QRDebug = () => {
  const [testData, setTestData] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const validateTestData = (data) => {
    try {
      const parsed = JSON.parse(data);
      
      const checks = {
        isObject: typeof parsed === 'object' && parsed !== null,
        hasDocumentType: parsed.documentType === 'INVOICE',
        hasCompanyName: parsed.companyName && parsed.companyName.includes('LindDoors'),
        hasOrderDetails: parsed.orderDetails && parsed.orderDetails.orderId,
        hasSecurity: !!parsed.security,
        hasPrintInfo: !!parsed.printInfo,
        hasMetadata: !!parsed.metadata
      };
      
      const isValid = checks.isObject && checks.hasDocumentType && checks.hasCompanyName && checks.hasOrderDetails;
      
      return {
        isValid,
        checks,
        data: parsed,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        checks: {},
        data: null,
        error: error.message
      };
    }
  };

  const handleTest = () => {
    const result = validateTestData(testData);
    setValidationResult(result);
  };

  const generateSampleData = () => {
    const sampleData = {
      documentType: "INVOICE",
      documentVersion: "2.0",
      companyName: "LindDoors Management System",
      orderDetails: {
        orderId: 123,
        orderType: "Derë Garazhi",
        status: "e përfunduar"
      },
      customer: {
        name: "Test Customer",
        phone: "123456789",
        location: "Test Location"
      },
      security: {
        verificationHash: "TEST123",
        authenticityToken: "LD2025TEST"
      },
      printInfo: {
        printedBy: "Test User",
        printDate: "31/05/2025",
        printTime: "14:40:00"
      },
      metadata: {
        qrVersion: "3.0",
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    setTestData(JSON.stringify(sampleData, null, 2));
  };

  const testWithCurrentURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrParam = urlParams.get('data');
    
    if (qrParam) {
      try {
        const decodedData = decodeURIComponent(qrParam);
        setTestData(decodedData);
        const result = validateTestData(decodedData);
        setValidationResult(result);
      } catch (error) {
        setValidationResult({
          isValid: false,
          checks: {},
          data: null,
          error: `URL decode error: ${error.message}`
        });
      }
    } else {
      setValidationResult({
        isValid: false,
        checks: {},
        data: null,
        error: 'No data parameter found in URL'
      });
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h4 className="mb-0">
            <Bug className="me-2" />
            QR Code Debug Tool
          </h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h6>Test QR Code Data:</h6>
            <div className="d-flex gap-2 mb-3">
              <Button variant="outline-primary" onClick={generateSampleData}>
                Generate Sample Data
              </Button>
              <Button variant="outline-secondary" onClick={testWithCurrentURL}>
                Test Current URL Data
              </Button>
              <Button variant="primary" onClick={handleTest}>
                Validate Data
              </Button>
            </div>
            
            <Form.Control
              as="textarea"
              rows={10}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="Paste QR code JSON data here..."
            />
          </div>

          {validationResult && (
            <Alert variant={validationResult.isValid ? 'success' : 'danger'}>
              <div className="d-flex align-items-center mb-2">
                {validationResult.isValid ? (
                  <CheckCircle className="me-2" />
                ) : (
                  <XCircle className="me-2" />
                )}
                <strong>
                  {validationResult.isValid ? 'Valid QR Code Data' : 'Invalid QR Code Data'}
                </strong>
              </div>
              
              {validationResult.error && (
                <div className="mb-3">
                  <strong>Error:</strong> {validationResult.error}
                </div>
              )}
              
              <div className="mb-3">
                <strong>Validation Checks:</strong>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {Object.entries(validationResult.checks).map(([key, value]) => (
                    <Badge key={key} bg={value ? 'success' : 'danger'}>
                      {key}: {value ? '✓' : '✗'}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {validationResult.data && (
                <details>
                  <summary><strong>Parsed Data Structure:</strong></summary>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
                    {JSON.stringify(validationResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </Alert>
          )}
          
          <div className="mt-4">
            <h6>Instructions:</h6>
            <ol>
              <li>Generate sample data to see what valid QR data looks like</li>
              <li>Test current URL data if you came here from a QR code scan</li>
              <li>Copy and paste actual QR code data to debug issues</li>
              <li>Check which validation requirements are failing</li>
            </ol>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QRDebug; 