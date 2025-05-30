import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import { 
  getSupplementaryOrdersByParentId, 
  updateSupplementaryOrderPaymentStatus, 
  deleteSupplementaryOrder 
} from '../../services/supplementaryOrderService';
import { getAllOrders } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import SupplementaryOrderInvoice from './SupplementaryOrderInvoice';

const AdditionalOrdersPage = () => {
  const [supplementaryOrders, setSupplementaryOrders] = useState([]);
  const [parentOrders, setParentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, inProcess, completed, debt, unpaid
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated, user } = useAuth();
  
  // Print invoice state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSupplementaryOrder, setSelectedSupplementaryOrder] = useState(null);
  const [selectedParentOrder, setSelectedParentOrder] = useState(null);
  
  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);
  
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all main orders to find garage door orders
      const allOrders = await getAllOrders();
      const garageDoorOrders = allOrders.filter(order => order.tipiPorosise === 'derë garazhi');
      setParentOrders(garageDoorOrders);
      
      // Then get all supplementary orders for these garage door orders
      const allSupplementaryOrders = [];
      for (const order of garageDoorOrders) {
        try {
          const response = await getSupplementaryOrdersByParentId(order.id);
          if (response.data && response.data.length > 0) {
            // Add parent order info to each supplementary order
            const ordersWithParent = response.data.map(suppOrder => ({
              ...suppOrder,
              parentOrderInfo: order
            }));
            allSupplementaryOrders.push(...ordersWithParent);
          }
        } catch (err) {
          // Continue if no supplementary orders for this parent
          console.log(`No supplementary orders for parent ${order.id}`);
        }
      }
      
      setSupplementaryOrders(allSupplementaryOrders);
    } catch (err) {
      console.error('Error fetching additional orders:', err);
      setError(`Ka ndodhur një gabim gjatë marrjes së porosive shtesë: ${err.message || 'Gabim i panjohur'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentUpdate = async (id, isPaid) => {
    try {
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
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Ka ndodhur një gabim gjatë përditësimit të statusit të pagesës: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të fshini këtë porosi shtesë?')) {
      return;
    }
    
    try {
      setError('');
      await deleteSupplementaryOrder(id);
      
      // Remove the order from the state
      setSupplementaryOrders(orders => orders.filter(order => order.id !== id));
    } catch (err) {
      console.error('Error deleting supplementary order:', err);
      setError(`Ka ndodhur një gabim gjatë fshirjes së porosisë shtesë: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handlePrintInvoice = (supplementaryOrder) => {
    setSelectedSupplementaryOrder(supplementaryOrder);
    setSelectedParentOrder(supplementaryOrder.parentOrderInfo);
    setShowPrintModal(true);
  };
  
  const filteredOrders = () => {
    let filtered = [...supplementaryOrders];
    
    // Apply status filter
    if (filter === 'inProcess') {
      filtered = filtered.filter(order => order.statusi === 'në proces');
    } else if (filter === 'completed') {
      filtered = filtered.filter(order => order.statusi === 'e përfunduar');
    } else if (filter === 'debt') {
      filtered = filtered.filter(order => order.statusi === 'borxh');
    } else if (filter === 'unpaid') {
      filtered = filtered.filter(order => !order.isPaymentDone);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.numriTelefonit.includes(searchTerm) ||
        order.vendi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pershkrimiProduktit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.kaparaReceiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parentOrderId.toString().includes(searchTerm)
      );
    }
    
    return filtered;
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
  
  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Duke ngarkuar porositë shtesë...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Porositë Shtesë</h2>
        <Button variant="outline-primary" onClick={fetchAllData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setError('');
                fetchAllData();
              }}
            >
              Provo përsëri
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Kërko sipas emrit, numrit të telefonit, produktit ose ID së porosisë kryesore"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Të Gjitha</option>
            <option value="inProcess">Në Proces</option>
            <option value="completed">Të Përfunduara</option>
            <option value="debt">Borxhe</option>
            <option value="unpaid">Të Papaguara</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID Shtesë</th>
            <th>Porosia Kryesore</th>
            <th>Klienti</th>
            <th>Produkti</th>
            <th>Çmimi</th>
            <th>Statusi</th>
            <th>Data e Krijimit</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders().map(order => (
            <tr key={order.id}>
              <td>
                <strong>#{order.id}</strong>
              </td>
              <td>
                <Badge bg="info">#{order.parentOrderId}</Badge><br/>
                <small className="text-muted">
                  {order.parentOrderInfo?.emriKlientit} {order.parentOrderInfo?.mbiemriKlientit}
                </small>
              </td>
              <td>
                <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br/>
                <small className="text-muted">{order.numriTelefonit}</small><br/>
                <small className="text-muted">{order.vendi}</small>
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
                    <Badge bg="danger">Mbetur: {parseFloat(order.pagesaMbetur || 0).toFixed(2)} €</Badge>
                  }
                </small>
              </td>
              <td>{getStatusBadge(order.statusi)}</td>
              <td>
                {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {!order.isPaymentDone && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, true)}
                    >
                      Paguaj
                    </Button>
                  )}
                  
                  {order.isPaymentDone && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, false)}
                    >
                      Anulo Pagesën
                    </Button>
                  )}
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handlePrintInvoice(order)}
                    title="Printo Faturën"
                  >
                    <i className="bi bi-printer"></i> Faturë
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(order.id)}
                  >
                    Fshi
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {filteredOrders().length === 0 && (
            <tr>
              <td colSpan="8" className="text-center py-4">
                {searchTerm || filter !== 'all' ? 
                  'Nuk u gjetën porosi shtesë me kriteret e zgjedhura' : 
                  'Nuk ka porosi shtesë të regjistruara'
                }
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Print Invoice Modal */}
      <Modal 
        show={showPrintModal} 
        onHide={() => setShowPrintModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Printo Faturën - Porosi Shtesë #{selectedSupplementaryOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SupplementaryOrderInvoice 
            supplementaryOrder={selectedSupplementaryOrder}
            parentOrder={selectedParentOrder}
            user={user}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
            Mbyll
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              window.print();
              setShowPrintModal(false);
            }}
          >
            <i className="bi bi-printer me-1"></i>
            Printo
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdditionalOrdersPage; 