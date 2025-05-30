import React, { forwardRef, useEffect, useRef } from 'react';
import { Card, Table, Row, Col, Container } from 'react-bootstrap';
import { format } from 'date-fns';
import QRCode from 'qrcode';

const SupplementaryOrderInvoice = forwardRef(({ supplementaryOrder, parentOrder, user }, ref) => {
  const qrCodeRef = useRef(null);
  
  if (!supplementaryOrder) return null;

  // Generate secure QR data
  const securityData = {
    supplementaryOrderId: supplementaryOrder.id,
    parentOrderId: supplementaryOrder.parentOrderId,
    timestamp: new Date().toISOString(),
    printedBy: user?.name || 'Admin',
    role: user?.role || 'Admin',
    verificationCode: `LD-SUP-${supplementaryOrder.id}-${Date.now().toString(36)}`
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

  const remainingPayment = parseFloat(supplementaryOrder.cmimiTotal) - parseFloat(supplementaryOrder.kaparja || 0);

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
                <h1 className="mb-4">FATURË - POROSI SHTESË</h1>
                <h5>Nr. i Porosisë Shtesë: #{supplementaryOrder.id}</h5>
                <p>Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p>Statusi: {supplementaryOrder.statusi}</p>
                {parentOrder && (
                  <p className="text-info">
                    <small>Lidhur me Porosinë Kryesore #{parentOrder.id}</small>
                  </p>
                )}
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <h5>Klienti:</h5>
                <p>
                  <strong>{supplementaryOrder.emriKlientit} {supplementaryOrder.mbiemriKlientit}</strong><br />
                  {supplementaryOrder.vendi}<br />
                  Tel: {supplementaryOrder.numriTelefonit}
                </p>
              </Col>
              <Col md={6} className="text-end">
                <h5>Detajet e Dërgesës:</h5>
                <p>
                  Lokacioni: {supplementaryOrder.vendi}<br />
                  {parentOrder && (
                    <>
                      Data e Dërgesës: {parentOrder.dita ? format(new Date(parentOrder.dita), 'dd/MM/yyyy') : 'N/A'}<br />
                      Dërguar me: Porosinë Kryesore #{parentOrder.id}
                    </>
                  )}
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
                    <strong>Produkt Shtesë</strong><br />
                    {supplementaryOrder.pershkrimiProduktit}
                  </td>
                  <td className="text-end">{parseFloat(supplementaryOrder.cmimiTotal).toFixed(2)} €</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>Kapari i Paguar</th>
                  <td className="text-end">{parseFloat(supplementaryOrder.kaparja || 0).toFixed(2)} €</td>
                </tr>
                <tr>
                  <th>Total i Mbetur</th>
                  <td className="text-end">{remainingPayment.toFixed(2)} €</td>
                </tr>
                <tr>
                  <th>Totali</th>
                  <td className="text-end"><strong>{parseFloat(supplementaryOrder.cmimiTotal).toFixed(2)} €</strong></td>
                </tr>
              </tfoot>
            </Table>

            <Row>
              <Col md={8}>
                <h5>Shënime:</h5>
                <p>
                  Faleminderit për besimin! Kjo porosi shtesë do të dërgohet së bashku me porosinë kryesore 
                  për të njëjtin lokacion.
                </p>
                <p>
                  <strong>Mënyra e Pagesës: </strong>{supplementaryOrder.menyraPageses === 'kesh' ? 'Kesh' : 'Bankë'}<br />
                  <strong>Pagesa e Përfunduar: </strong>{supplementaryOrder.isPaymentDone ? 'Po' : 'Jo'}<br />
                  {supplementaryOrder.kaparaReceiver && (
                    <>
                      <strong>Kaparja u mor nga: </strong>{supplementaryOrder.kaparaReceiver}<br />
                    </>
                  )}
                </p>
                {parentOrder && (
                  <p className="text-info">
                    <strong>Shënim:</strong> Kjo porosi shtesë do të dërgohet së bashku me porosinë kryesore 
                    #{parentOrder.id} ({parentOrder.tipiPorosise}) në të njëjtin transport.
                  </p>
                )}
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

export default SupplementaryOrderInvoice; 