import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { createSupplementaryOrder } from '../../services/supplementaryOrderService';

const SupplementaryOrderForm = ({ show, onHide, parentOrder, onSuccess }) => {
  const [formData, setFormData] = useState({
    emriKlientit: '',
    mbiemriKlientit: '',
    numriTelefonit: '',
    vendi: parentOrder?.vendi || '',
    pershkrimiProduktit: '',
    cmimiTotal: '',
    kaparja: '',
    kaparaReceiver: '',
    menyraPageses: 'kesh',
    isPaymentDone: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update location when parent order changes
  React.useEffect(() => {
    if (parentOrder) {
      setFormData(prev => ({
        ...prev,
        vendi: parentOrder.vendi || ''
      }));
    }
  }, [parentOrder]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!parentOrder) {
      setError('Porosia kryesore nuk është zgjedhur!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validate required fields
      const requiredFields = ['emriKlientit', 'mbiemriKlientit', 'numriTelefonit', 'vendi', 'pershkrimiProduktit', 'cmimiTotal'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`Fusha "${field}" është e detyrueshme!`);
        }
      }

      // Validate numeric fields
      if (isNaN(parseFloat(formData.cmimiTotal)) || parseFloat(formData.cmimiTotal) <= 0) {
        throw new Error('Çmimi total duhet të jetë një numër pozitiv!');
      }

      if (formData.kaparja && (isNaN(parseFloat(formData.kaparja)) || parseFloat(formData.kaparja) < 0)) {
        throw new Error('Kaparja duhet të jetë një numër pozitiv ose zero!');
      }

      // Validate that advance payment doesn't exceed total price
      const total = parseFloat(formData.cmimiTotal);
      const advance = parseFloat(formData.kaparja || 0);
      if (advance > total) {
        throw new Error('Kaparja nuk mund të jetë më e madhe se çmimi total!');
      }

      // Prepare data for submission
      const supplementaryOrderData = {
        parentOrderId: parentOrder.id,
        ...formData,
        cmimiTotal: total,
        kaparja: advance
      };

      const result = await createSupplementaryOrder(supplementaryOrderData);
      
      // Reset form
      setFormData({
        emriKlientit: '',
        mbiemriKlientit: '',
        numriTelefonit: '',
        vendi: parentOrder?.vendi || '',
        pershkrimiProduktit: '',
        cmimiTotal: '',
        kaparja: '',
        kaparaReceiver: '',
        menyraPageses: 'kesh',
        isPaymentDone: false
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Close modal
      onHide();
    } catch (err) {
      console.error('Error creating supplementary order:', err);
      setError(err.message || 'Gabim gjatë krijimit të porosisë shtesë');
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingPayment = () => {
    const total = parseFloat(formData.cmimiTotal || 0);
    const advance = parseFloat(formData.kaparja || 0);
    return Math.max(0, total - advance).toFixed(2);
  };

  return (
    <Modal 
      show={show} 
      onHide={loading ? null : onHide} 
      size="lg"
      backdrop={loading ? 'static' : true}
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          Shto Porosi Shtesë për Porosinë #{parentOrder?.id}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {parentOrder && (
            <Alert variant="info" className="mb-3">
              <strong>Porosia Kryesore:</strong> {parentOrder.tipiPorosise} - {parentOrder.emriKlientit} {parentOrder.mbiemriKlientit}<br />
              <strong>Lokacioni:</strong> {parentOrder.vendi}<br />
              <small>Porosia shtesë do të dërgohet në të njëjtin lokacion.</small>
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Emri i Klientit *</Form.Label>
                <Form.Control
                  type="text"
                  name="emriKlientit"
                  value={formData.emriKlientit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mbiemri i Klientit *</Form.Label>
                <Form.Control
                  type="text"
                  name="mbiemriKlientit"
                  value={formData.mbiemriKlientit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Numri i Telefonit *</Form.Label>
                <Form.Control
                  type="tel"
                  name="numriTelefonit"
                  value={formData.numriTelefonit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lokacioni *</Form.Label>
                <Form.Control
                  type="text"
                  name="vendi"
                  value={formData.vendi}
                  onChange={handleChange}
                  required
                  disabled={true}
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  Lokacioni duhet të jetë i njëjtë me porosinë kryesore
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Përshkrimi i Produktit *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="pershkrimiProduktit"
                  value={formData.pershkrimiProduktit}
                  onChange={handleChange}
                  placeholder="P.sh. Keramika për banjo, Dysheme laminat, etj."
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Çmimi Total (€) *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="cmimiTotal"
                  value={formData.cmimiTotal}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Kaparja (€)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="kaparja"
                  value={formData.kaparja}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Pagesa e Mbetur (€)</Form.Label>
                <Form.Control
                  type="text"
                  value={calculateRemainingPayment()}
                  disabled
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Personi që Mori Kaparën</Form.Label>
                <Form.Control
                  type="text"
                  name="kaparaReceiver"
                  value={formData.kaparaReceiver}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mënyra e Pagesës *</Form.Label>
                <Form.Select
                  name="menyraPageses"
                  value={formData.menyraPageses}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="kesh">Kesh</option>
                  <option value="banke">Bankë</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Pagesa Përfunduar</Form.Label>
                <Form.Select
                  name="isPaymentDone"
                  value={formData.isPaymentDone ? 'true' : 'false'}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'isPaymentDone',
                      type: 'select',
                      value: e.target.value === 'true'
                    }
                  })}
                  disabled={loading}
                >
                  <option value="false">❌ Jo</option>
                  <option value="true">✅ Po</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Zgjidhni "Po" nëse pagesa është kryer plotësisht
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Anulo
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner 
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Duke ruajtur...
              </>
            ) : 'Ruaj Porosinë Shtesë'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SupplementaryOrderForm; 