import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { CreditCard, CurrencyEuro, Person } from 'react-bootstrap-icons';

const PartialPaymentModal = ({ 
  show, 
  onHide, 
  order = null, 
  supplementaryOrder = null, 
  onPaymentSuccess 
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceiver, setPaymentReceiver] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if this is for main order or supplementary order
  const isSupplementaryOrder = supplementaryOrder !== null;
  const orderData = isSupplementaryOrder ? supplementaryOrder : order;

  // Calculate remaining debt
  const remainingDebt = orderData ? 
    parseFloat(orderData.cmimiTotal || 0) - parseFloat(orderData.kaparja || 0) : 0;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setPaymentAmount('');
      setPaymentReceiver(orderData?.kaparaReceiver || '');
      setError('');
    }
  }, [show, orderData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Shuma e pagesës duhet të jetë një numër pozitiv!');
      return;
    }

    if (parseFloat(paymentAmount) > remainingDebt) {
      setError(`Shuma e pagesës nuk mund të jetë më e madhe se borxhi i mbetur (€${remainingDebt.toFixed(2)})!`);
      return;
    }

    if (!paymentReceiver.trim()) {
      setError('Emri i personit që mori pagesën është i detyrueshëm!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onPaymentSuccess({
        orderId: orderData.id,
        paymentAmount: parseFloat(paymentAmount),
        paymentReceiver: paymentReceiver.trim(),
        isSupplementaryOrder
      });
      
      onHide();
    } catch (err) {
      setError(err.message || 'Ka ndodhur një gabim gjatë regjistrimit të pagesës');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPaymentAmount(value);
      setError('');
    }
  };

  const handlePayFullAmount = () => {
    setPaymentAmount(remainingDebt.toFixed(2));
    setError('');
  };

  if (!orderData) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <CreditCard className="me-2" />
          Shto Pagesë {isSupplementaryOrder ? 'Shtesë' : ''}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {/* Order Information */}
          <div className="mb-4 p-3 bg-light rounded">
            <h6 className="mb-2">
              {isSupplementaryOrder ? 'Porosia Shtesë' : 'Porosia'} #{orderData.id}
            </h6>
            <div className="row">
              <div className="col-6">
                <small className="text-muted">Çmimi Total:</small>
                <div className="fw-bold">€{parseFloat(orderData.cmimiTotal || 0).toFixed(2)}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">Paguar Deri Tani:</small>
                <div className="fw-bold text-success">€{parseFloat(orderData.kaparja || 0).toFixed(2)}</div>
              </div>
            </div>
            <hr className="my-2" />
            <div className="text-center">
              <small className="text-muted">Borxhi i Mbetur:</small>
              <div className="h5 text-danger mb-0">€{remainingDebt.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Amount Input */}
          <Form.Group className="mb-3">
            <Form.Label>
              <CurrencyEuro className="me-1" />
              Shuma e Pagesës
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>€</InputGroup.Text>
              <Form.Control
                type="text"
                value={paymentAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                max={remainingDebt}
                step="0.01"
                required
                autoFocus
              />
              <Button 
                variant="outline-secondary" 
                onClick={handlePayFullAmount}
                disabled={remainingDebt <= 0}
              >
                Të Gjitha
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Maksimumi: €{remainingDebt.toFixed(2)}
            </Form.Text>
          </Form.Group>

          {/* Payment Receiver Input */}
          <Form.Group className="mb-3">
            <Form.Label>
              <Person className="me-1" />
              Mori Pagesën
            </Form.Label>
            <Form.Control
              type="text"
              value={paymentReceiver}
              onChange={(e) => setPaymentReceiver(e.target.value)}
              placeholder="Emri i personit që mori pagesën"
              required
            />
          </Form.Group>

          {/* Payment Preview */}
          {paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= remainingDebt && (
            <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
              <h6 className="text-info mb-2">Përmbledhje e Pagesës:</h6>
              <div className="row">
                <div className="col-6">
                  <small>Pagesa e re:</small>
                  <div className="fw-bold">€{parseFloat(paymentAmount).toFixed(2)}</div>
                </div>
                <div className="col-6">
                  <small>Borxhi pas pagesës:</small>
                  <div className="fw-bold">
                    €{(remainingDebt - parseFloat(paymentAmount)).toFixed(2)}
                  </div>
                </div>
              </div>
              {(remainingDebt - parseFloat(paymentAmount)) <= 0.01 && (
                <div className="mt-2">
                  <small className="text-success fw-bold">
                    ✅ Porosia do të shënohet si e paguar plotësisht!
                  </small>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Anulo
          </Button>
          <Button 
            type="submit" 
            variant="success" 
            disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            {loading ? 'Duke regjistruar...' : 'Regjistro Pagesën'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PartialPaymentModal; 