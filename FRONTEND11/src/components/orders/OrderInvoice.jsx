import React, { forwardRef, useEffect, useRef } from 'react';
import { Card, Table, Row, Col, Container } from 'react-bootstrap';
import { format } from 'date-fns';
import QRCode from 'qrcode';

const OrderInvoice = forwardRef(({ order, user }, ref) => {
  const qrCodeRef = useRef(null);
  
  if (!order) return null;

  // Generate secure QR data
  const securityData = {
    orderId: order.id,
    timestamp: new Date().toISOString(),
    printedBy: user?.name || 'Admin',
    role: user?.role || 'Admin',
    verificationCode: `LD-${order.id}-${Date.now().toString(36)}`
  };

  // Format the security data as a JSON string
  const qrCodeValue = JSON.stringify(securityData);
  
  // Generate QR code
  useEffect(() => {
    if (qrCodeRef.current && qrCodeValue) {
      QRCode.toCanvas(qrCodeRef.current, qrCodeValue, {
        width: 120,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
    }
  }, [qrCodeValue, qrCodeRef]);

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
              <Col md={8}>
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
              <Col md={4} className="text-end">
                <div className="security-stamp" style={{ border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
                  <canvas ref={qrCodeRef} />
                  <p className="text-muted mt-2 small">
                    Stampë Sigurie<br />
                    Printuar nga: {securityData.printedBy}<br />
                    {format(new Date(securityData.timestamp), 'dd/MM/yyyy HH:mm')}
                  </p>
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