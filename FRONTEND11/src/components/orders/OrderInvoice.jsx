import React, { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import { Card, Table, Row, Col, Container } from 'react-bootstrap';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import DimensionVisualization from './DimensionVisualization';
import { generateQRData, generateQRUrl, generateFallbackQRData } from '../../utils/qrDataGenerator';

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
    return generateQRData(order, user, 'INVOICE');
  }, [order.id, order.emriKlientit, order.mbiemriKlientit, order.cmimiTotal, order.kaparja, order.tipiPorosise, order.statusi, user?.emri, user?.mbiemri, user?.name, user?.role, user?.email]); // Only depend on stable values

  // Generate QR code only once when component mounts or order changes
  useEffect(() => {
    if (qrGenerated) return; // Prevent regeneration
    
    const generateQRCode = async () => {
      try {
        // Generate the verification URL
        const verificationUrl = generateQRUrl(qrData, QR_CONFIG);
        
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
          const fallbackData = generateFallbackQRData(order, user, 'INVOICE');
          const fallbackUrl = generateQRUrl(fallbackData, QR_CONFIG);
          
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
  }, [order.id, qrGenerated, qrData]); // Only depend on order.id, generation status, and qrData

  // Prepare dimension data for visualization
  const dimensionData = {
    gjatesia: order.gjatesia,
    gjeresia: order.gjeresia,
    profiliLarte: order.profiliLarte,
    profiliPoshtem: order.profiliPoshtem,
    gjatesiaFinale: order.gjatesiaFinale || (order.gjatesia && order.profiliLarte ? 
      parseFloat(order.gjatesia) - parseFloat(order.profiliLarte) : null),
    gjeresiaFinale: order.gjeresiaFinale || (order.gjeresia && order.profiliPoshtem ? 
      parseFloat(order.gjeresia) - parseFloat(order.profiliPoshtem) : null)
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
                  Kodi i Autenticitetit: <strong>{qrData.verification.code}</strong>
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
                    <div><strong>Kodi i Verifikimit:</strong></div>
                    <div><code style={{ fontSize: '10px' }}>{qrData.verification.code}</code></div>
                    <hr className="my-2" />
                    <div><strong>Data e Krijimit:</strong></div>
                    <div>{format(new Date(qrData.verification.generatedAt), 'dd/MM/yyyy HH:mm')}</div>
                    <hr className="my-2" />
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
                  <strong>Verifikimi i Autenticitetit:</strong> {qrData.verification.code} | 
                  <strong> Versioni QR:</strong> {qrData.metadata.qrVersion}
                  <br />
                  <em>Ky dokument është i verifikuar dhe autentik. Për verifikim kontaktoni: +383 44 123 456</em>
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