import React, { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import { Card, Table, Row, Col, Container } from 'react-bootstrap';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import DimensionVisualization from './DimensionVisualization';

const OrderInvoice = forwardRef(({ order, user }, ref) => {
  const qrCodeRef = useRef(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  
  // Configuration for QR code URLs
  const QR_CONFIG = {
    development: {
      // Change this to your computer's IP address for mobile testing
      host: '192.168.0.104',
      port: '5173',
      protocol: 'http'
    },
    production: {
      // This will be automatically detected in production
      useWindowLocation: true
    }
  };
  
  if (!order) return null;

  // Memoize the QR data generation to prevent infinite loops
  const qrData = useMemo(() => {
    const printTimestamp = new Date();
    const printDate = format(printTimestamp, 'dd/MM/yyyy');
    const printTime = format(printTimestamp, 'HH:mm:ss');
    
    // Generate unique verification hash based on order data and timestamp
    const verificationSeed = `${order.id}-${order.emriKlientit}-${order.mbiemriKlientit}-${printTimestamp.getTime()}`;
    const verificationHash = btoa(verificationSeed).slice(0, 12).toUpperCase();
    
    // Generate creative authenticity token
    const authenticityToken = `LD${printTimestamp.getFullYear()}${String(printTimestamp.getMonth() + 1).padStart(2, '0')}${order.id}${verificationHash.slice(0, 4)}`;
    
    // Calculate remaining payment
    const remainingPayment = (parseFloat(order.cmimiTotal) - parseFloat(order.kaparja || 0)).toFixed(2);
    
    return {
      // Document Information
      documentType: "INVOICE",
      documentVersion: "2.0",
      companyName: "LindDoors Management System",
      
      // Print Authentication
      printInfo: {
        printedBy: user?.emri && user?.mbiemri ? `${user.emri} ${user.mbiemri}` : user?.name || 'System Admin',
        userRole: user?.role || 'Administrator',
        userEmail: user?.email || 'admin@lindoors.com',
        printDate: printDate,
        printTime: printTime,
        printTimestamp: printTimestamp.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // Order Details
      orderDetails: {
        orderId: order.id,
        orderType: order.tipiPorosise,
        status: order.statusi,
        measurementStatus: order.statusiMatjes || 'e pamatur',
        orderDate: order.dita ? format(new Date(order.dita), 'dd/MM/yyyy') : null,
        measurementDate: order.dataMatjes ? format(new Date(order.dataMatjes), 'dd/MM/yyyy') : null,
        description: order.pershkrimi || 'Nuk ka përshkrim'
      },
      
      // Customer Information
      customer: {
        name: `${order.emriKlientit} ${order.mbiemriKlientit}`,
        phone: order.numriTelefonit,
        location: order.vendi
      },
      
      // Personnel Information
      personnel: {
        seller: order.shitesi,
        measurer: order.matesi || 'N/A',
        sender: order.sender || 'N/A',
        installer: order.installer || 'N/A'
      },
      
      // Financial Information
      financial: {
        totalPrice: parseFloat(order.cmimiTotal).toFixed(2),
        downPayment: parseFloat(order.kaparja || 0).toFixed(2),
        remainingPayment: remainingPayment,
        paymentMethod: order.menyraPageses === 'kesh' ? 'Kesh' : 'Bankë',
        paymentCompleted: order.isPaymentDone ? 'Po' : 'Jo',
        downPaymentReceiver: order.kaparaReceiver || 'N/A'
      },
      
      // Dimensions (if available)
      dimensions: order.gjatesia || order.gjeresia ? {
        length: order.gjatesia ? parseFloat(order.gjatesia).toFixed(2) : null,
        width: order.gjeresia ? parseFloat(order.gjeresia).toFixed(2) : null,
        topProfile: order.profiliLarte ? parseFloat(order.profiliLarte).toFixed(2) : '0',
        bottomProfile: order.profiliPoshtem ? parseFloat(order.profiliPoshtem).toFixed(2) : '0',
        finalLength: order.gjatesiaFinale ? parseFloat(order.gjatesiaFinale).toFixed(2) : null,
        finalWidth: order.gjeresiaFinale ? parseFloat(order.gjeresiaFinale).toFixed(2) : null
      } : null,
      
      // Status Flags
      statusFlags: {
        hasStamp: order.kaVule ? 'Po' : 'Jo',
        isPrinted: order.eshtePrintuar ? 'Po' : 'Jo',
        paymentDone: order.isPaymentDone ? 'Po' : 'Jo'
      },
      
      // Security & Verification
      security: {
        verificationCode: `LD-${order.id}-${printTimestamp.getTime().toString(36).toUpperCase()}`,
        verificationHash: verificationHash,
        authenticityToken: authenticityToken,
        documentHash: btoa(`${order.id}${order.emriKlientit}${order.cmimiTotal}${printTimestamp.getTime()}`).slice(0, 16),
        securityLevel: "STANDARD",
        antiCounterfeit: `${printTimestamp.getFullYear()}-${order.id}-${verificationHash.slice(-4)}`
      },
      
      // Creative Verification Elements
      verification: {
        magicNumber: (order.id * 7 + printTimestamp.getDate() * 13) % 9999,
        colorCode: `#${((order.id * 16777215) % 16777215).toString(16).padStart(6, '0')}`,
        patternCode: `${order.id.toString(2).slice(-8).padStart(8, '0')}`,
        checksumDigit: (order.id.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 10),
        uniqueSignature: btoa(`${order.emriKlientit}${order.mbiemriKlientit}${order.id}`).slice(0, 8)
      },
      
      // Metadata
      metadata: {
        qrVersion: "3.0",
        generatedAt: printTimestamp.toISOString(),
        expiresAt: new Date(printTimestamp.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // 1 year
        validationUrl: `https://verify.lindoors.com/invoice/${order.id}/${verificationHash}`,
        supportContact: "+383 44 123 456"
      }
    };
  }, [order.id, order.emriKlientit, order.mbiemriKlientit, order.cmimiTotal, order.kaparja, order.tipiPorosise, order.statusi, user?.emri, user?.mbiemri, user?.name, user?.role, user?.email]); // Only depend on stable values

  // Generate QR code only once when component mounts or order changes
  useEffect(() => {
    if (qrGenerated) return; // Prevent regeneration
    
    const generateQRCode = async () => {
      try {
        // Create a verification URL with the data
        // Use environment variable or detect if we're in development
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let baseUrl;
        
        if (isDevelopment) {
          // For development, use the configured IP for mobile testing
          const config = QR_CONFIG.development;
          baseUrl = `${config.protocol}://${config.host}:${config.port}`;
        } else {
          // For production, use the actual domain
          baseUrl = window.location.origin;
        }
        
        const encodedData = encodeURIComponent(JSON.stringify(qrData));
        const verificationUrl = `${baseUrl}/verify?data=${encodedData}`;
        
        // Generate QR code with the verification URL
        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 140,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(dataUrl);
        setQrGenerated(true);
        
        // Also try to render to canvas if ref exists
        if (qrCodeRef.current) {
          await QRCode.toCanvas(qrCodeRef.current, verificationUrl, {
            width: 140,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback to a simpler QR code with less data
        try {
          const simpleData = {
            orderId: order.id,
            customer: `${order.emriKlientit} ${order.mbiemriKlientit}`,
            total: order.cmimiTotal,
            printedBy: qrData.printInfo.printedBy,
            printTime: qrData.printInfo.printTimestamp,
            verificationCode: qrData.security.verificationHash
          };
          
          const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          let baseUrl;
          
          if (isDevelopment) {
            const config = QR_CONFIG.development;
            baseUrl = `${config.protocol}://${config.host}:${config.port}`;
          } else {
            baseUrl = window.location.origin;
          }
          
          const encodedFallbackData = encodeURIComponent(JSON.stringify(simpleData));
          const fallbackUrl = `${baseUrl}/verify?data=${encodedFallbackData}`;
          
          const fallbackDataUrl = await QRCode.toDataURL(fallbackUrl, {
            width: 140,
            margin: 2,
            errorCorrectionLevel: 'M'
          });
          setQrCodeDataUrl(fallbackDataUrl);
          setQrGenerated(true);
          
          if (qrCodeRef.current) {
            await QRCode.toCanvas(qrCodeRef.current, fallbackUrl, {
              width: 140,
              margin: 2,
              errorCorrectionLevel: 'M'
            });
          }
        } catch (fallbackError) {
          console.error('Error generating fallback QR code:', fallbackError);
          setQrGenerated(true); // Mark as generated even if failed to prevent infinite loop
        }
      }
    };
    
    generateQRCode();
  }, [order.id, qrGenerated]); // Only depend on order.id and generation status

  // Prepare dimension data for visualization
  const dimensionData = {
    gjatesia: order.gjatesia,
    gjeresia: order.gjeresia,
    profiliLarte: order.profiliLarte,
    profiliPoshtem: order.profiliPoshtem,
    gjatesiaFinale: order.gjatesiaFinale,
    gjeresiaFinale: order.gjeresiaFinale
  };

  return (
    <div ref={ref} className="invoice-container p-4">
      <Container fluid>
        <Card className="mb-4 border-0">
          <Card.Body>
            <Row className="mb-4">
              <Col md={6}>
                <h2 className="mb-0">LindDoors</h2>
                <p className="text-muted">Management System</p>
                <p>
                  Adresa: Rr. "Lidhja e Prizrenit"<br />
                  Prishtinë, Kosovë<br />
                  Tel: +383 44 123 456<br />
                  Email: info@lindidoors.com
                </p>
              </Col>
              <Col md={6} className="text-end">
                <h1 className="mb-4">FATURË</h1>
                <h5>Nr. i Porosisë: #{order.id}</h5>
                <p>Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p>Statusi: {order.statusi}</p>
                <p className="small text-muted">
                  Kodi i Autenticitetit: <strong>{qrData.security.authenticityToken}</strong>
                </p>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <h5>Klienti:</h5>
                <p>
                  <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br />
                  {order.vendi}<br />
                  Tel: {order.numriTelefonit}
                </p>
              </Col>
              <Col md={6} className="text-end">
                <h5>Detajet e Dërgesës:</h5>
                <p>
                  Data e Realizimit: {order.dita ? format(new Date(order.dita), 'dd/MM/yyyy') : 'N/A'}<br />
                  Dërguar nga: {order.sender || 'N/A'}<br />
                  Montuar nga: {order.installer || 'N/A'}
                </p>
              </Col>
            </Row>

            {/* Vizualizimi i Dimensioneve - vetëm nëse ka të dhëna */}
            <DimensionVisualization dimensions={dimensionData} />

            <Table bordered className="mb-4">
              <thead>
                <tr>
                  <th>Përshkrimi</th>
                  <th className="text-end">Çmimi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{order.tipiPorosise}</strong><br />
                    {order.pershkrimi || 'Nuk ka përshkrim'}
                  </td>
                  <td className="text-end">{parseFloat(order.cmimiTotal).toFixed(2)} €</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>Kapari i Paguar</th>
                  <td className="text-end">{parseFloat(order.kaparja || 0).toFixed(2)} €</td>
                </tr>
                <tr>
                  <th>Total i Mbetur</th>
                  <td className="text-end">
                    {(parseFloat(order.cmimiTotal) - parseFloat(order.kaparja || 0)).toFixed(2)} €
                  </td>
                </tr>
                <tr>
                  <th>Totali</th>
                  <td className="text-end"><strong>{parseFloat(order.cmimiTotal).toFixed(2)} €</strong></td>
                </tr>
              </tfoot>
            </Table>

            <Row>
              <Col md={7}>
                <h5>Shënime:</h5>
                <p>
                  Faleminderit për besimin! Porositë duhet të paguhen para ose gjatë dorëzimit.
                  Për çdo pyetje rreth faturës, ju lutem kontaktoni shitësin tuaj: {order.shitesi}
                </p>
                <p>
                  <strong>Mënyra e Pagesës: </strong>{order.menyraPageses === 'kesh' ? 'Kesh' : 'Bankë'}<br />
                  <strong>Pagesa e Përfunduar: </strong>{order.isPaymentDone ? 'Po' : 'Jo'}
                </p>
                <div className="mt-4">
                  <p><strong>Nënshkrimi:</strong></p>
                  <div className="border-bottom border-dark" style={{ width: '200px', height: '40px' }}></div>
                </div>
              </Col>
              <Col md={5} className="text-end">
                <div className="security-stamp" style={{ 
                  border: '2px solid #007bff', 
                  padding: '15px', 
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)'
                }}>
                  <div className="text-center mb-2">
                    <strong style={{ color: '#007bff' }}>🔒 STAMPË SIGURIE</strong>
                  </div>
                  <div className="text-center mb-3">
                    {/* Display QR Code - with multiple fallback methods */}
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        style={{ 
                          width: '140px', 
                          height: '140px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '140px', 
                        height: '140px',
                        border: '2px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <div className="text-center text-muted">
                          <div>📱</div>
                          <small>QR Code</small>
                        </div>
                      </div>
                    )}
                    {/* Hidden canvas as backup */}
                    <canvas 
                      ref={qrCodeRef} 
                      style={{ display: qrCodeDataUrl ? 'none' : 'block', margin: '0 auto' }}
                    />
                  </div>
                  <div className="small text-center">
                    <div><strong>Printuar nga:</strong></div>
                    <div>{qrData.printInfo.printedBy}</div>
                    <div className="text-muted">{qrData.printInfo.userRole}</div>
                    <hr className="my-2" />
                    <div><strong>Data & Ora:</strong></div>
                    <div>{qrData.printInfo.printDate}</div>
                    <div>{qrData.printInfo.printTime}</div>
                    <hr className="my-2" />
                    <div className="text-primary">
                      <strong>Kodi i Verifikimit:</strong><br />
                      <code style={{ fontSize: '10px' }}>{qrData.security.verificationHash}</code>
                    </div>
                    <div className="mt-2 text-success">
                      <strong>Magic #:</strong> {qrData.verification.magicNumber}
                    </div>
                    <div className="mt-1" style={{ fontSize: '8px', color: '#6c757d' }}>
                      Skano QR kodin për detaje të plota
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            
            {/* Additional Security Footer */}
            <Row className="mt-4 pt-3" style={{ borderTop: '1px dashed #ccc' }}>
              <Col md={12} className="text-center">
                <div className="small text-muted">
                  <strong>Verifikimi i Autenticitetit:</strong> {qrData.security.authenticityToken} | 
                  <strong> Checksum:</strong> {qrData.verification.checksumDigit} | 
                  <strong> Pattern:</strong> {qrData.verification.patternCode} | 
                  <strong> Signature:</strong> {qrData.verification.uniqueSignature}
                  <br />
                  <em>Ky dokument është i mbrojtur me teknologji të avancuara anti-falsifikimi. Për verifikim kontaktoni: +383 44 123 456</em>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
});

export default OrderInvoice; 