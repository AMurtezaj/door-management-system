import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  getSupplementaryOrdersByParentId, 
  updateSupplementaryOrderPaymentStatus, 
  deleteSupplementaryOrder 
} from '../../services/supplementaryOrderService';
import { useAuth } from '../../context/AuthContext';

const SupplementaryOrdersList = ({ parentOrderId, onUpdate }) => {
  const { canManagePayments, canEditOrders, isManager } = useAuth();
  const [supplementaryOrders, setSupplementaryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (parentOrderId) {
      fetchSupplementaryOrders();
    }
  }, [parentOrderId]);

  const fetchSupplementaryOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getSupplementaryOrdersByParentId(parentOrderId);
      setSupplementaryOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching supplementary orders:', err);
      setError(err.message || 'Gabim gjatë ngarkimit të porosive shtesë');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (id, isPaid) => {
    try {
      setActionLoading(prev => ({ ...prev, [`payment_${id}`]: true }));
      setError('');
      
      await updateSupplementaryOrderPaymentStatus(id, isPaid);
      
      // Update the order in the state
      setSupplementaryOrders(orders => 
        orders.map(order => 
          order.id === id ? { 
            ...order, 
            isPaymentDone: isPaid,
            statusi: isPaid ? 'e përfunduar' : 'borxh'
          } : order
        )
      );

      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err.message || 'Gabim gjatë përditësimit të statusit të pagesës');
    } finally {
      setActionLoading(prev => ({ ...prev, [`payment_${id}`]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të fshini këtë porosi shtesë?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }));
      setError('');
      
      await deleteSupplementaryOrder(id);
      
      // Remove the order from the state
      setSupplementaryOrders(orders => orders.filter(order => order.id !== id));

      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error deleting supplementary order:', err);
      setError(err.message || 'Gabim gjatë fshirjes së porosisë shtesë');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'në proces':
        return <Badge bg="warning">Në Proces</Badge>;
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'borxh':
        return <Badge bg="danger">Borxh</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const calculateTotal = () => {
    return supplementaryOrders.reduce((total, order) => {
      return total + parseFloat(order.cmimiTotal || 0);
    }, 0);
  };

  const calculateTotalDebt = () => {
    return supplementaryOrders.reduce((total, order) => {
      if (!order.isPaymentDone) {
        return total + parseFloat(order.pagesaMbetur || 0);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <Card className="mt-3">
        <Card.Header>
          <h6 className="mb-0">Porositë Shtesë</h6>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 mb-0">Duke ngarkuar porositë shtesë...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Porositë Shtesë ({supplementaryOrders.length})</h6>
        {supplementaryOrders.length > 0 && (
          <div className="text-end">
            <small className="text-muted">
              Total: {calculateTotal().toFixed(2)} € | 
              Borxh: {calculateTotalDebt().toFixed(2)} €
            </small>
          </div>
        )}
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="ms-2"
              onClick={fetchSupplementaryOrders}
            >
              Provo përsëri
            </Button>
          </Alert>
        )}

        {supplementaryOrders.length === 0 ? (
          <div className="text-center py-3 text-muted">
            <i className="bi bi-inbox fs-1"></i>
            <p className="mt-2 mb-0">Nuk ka porosi shtesë për këtë porosi.</p>
          </div>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Klienti</th>
                <th>Produkti</th>
                <th>Çmimi</th>
                <th>Statusi</th>
                <th>Veprime</th>
              </tr>
            </thead>
            <tbody>
              {supplementaryOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br/>
                    <small className="text-muted">{order.numriTelefonit}</small>
                  </td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={order.pershkrimiProduktit}>
                      {order.pershkrimiProduktit}
                    </div>
                    {order.kaparaReceiver && (
                      <small className="text-muted">
                        Kaparja nga: {order.kaparaReceiver}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{parseFloat(order.cmimiTotal).toFixed(2)} €</strong><br/>
                    <small>
                      {order.isPaymentDone ? 
                        <Badge bg="success">Paguar</Badge> : 
                        <Badge bg="danger">Mbetur: {parseFloat(order.pagesaMbetur).toFixed(2)} €</Badge>
                      }
                    </small>
                  </td>
                  <td>{getStatusBadge(order.statusi)}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {!order.isPaymentDone && canManagePayments && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          onClick={() => handlePaymentUpdate(order.id, true)}
                          disabled={actionLoading[`payment_${order.id}`]}
                        >
                          {actionLoading[`payment_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Paguaj'}
                        </Button>
                      )}
                      
                      {!order.isPaymentDone && !canManagePayments && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          disabled
                          title="Vetëm administratori mund të menaxhojë pagesat"
                        >
                          Paguaj
                        </Button>
                      )}
                      
                      {order.isPaymentDone && canManagePayments && (
                        <Button 
                          variant="warning" 
                          size="sm" 
                          onClick={() => handlePaymentUpdate(order.id, false)}
                          disabled={actionLoading[`payment_${order.id}`]}
                        >
                          {actionLoading[`payment_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Anulo'}
                        </Button>
                      )}
                      
                      {canEditOrders && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(order.id)}
                          disabled={actionLoading[`delete_${order.id}`]}
                        >
                          {actionLoading[`delete_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Fshi'}
                        </Button>
                      )}
                      
                      {isManager && !canEditOrders && (
                        <small className="text-muted align-self-center">
                          Vetëm shikimi
                        </small>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default SupplementaryOrdersList; 