import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Spinner, Alert, Tabs, Tab, Modal } from 'react-bootstrap';
import { Search, Rulers } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { getOrdersByMeasurementStatus, updateMeasurementStatus } from '../services/orderService';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const MeasurementStatusPage = () => {
  const [unmeasuredOrders, setUnmeasuredOrders] = useState([]);
  const [measuredOrders, setMeasuredOrders] = useState([]);
  const [unmeasuredLoading, setUnmeasuredLoading] = useState(true);
  const [measuredLoading, setMeasuredLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unmeasured');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [measurementData, setMeasurementData] = useState({
    matesi: '',
    dataMatjes: format(new Date(), 'yyyy-MM-dd'),
    statusiMatjes: 'e matur'
  });
  const { user, isAuthenticated, refreshAuth } = useAuth();

  // Fetch measurement data on component mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchMeasurementData();
    }
  }, [isAuthenticated]);

  // Fetch all measurement data
  const fetchMeasurementData = async () => {
    try {
      console.log('Fetching measurement data...');
      setError('');
      
      // Fetch all data in parallel
      await Promise.all([
        fetchUnmeasuredOrders(),
        fetchMeasuredOrders()
      ]);
      
      console.log('All measurement data fetched successfully');
    } catch (err) {
      console.error('Error in fetchMeasurementData:', err);
      setError(`Gabim gjatë ngarkimit të të dhënave: ${err.message || 'Gabim i panjohur'}`);
    }
  };

  // Fetch unmeasured orders
  const fetchUnmeasuredOrders = async () => {
    try {
      setUnmeasuredLoading(true);
      console.log('Fetching unmeasured orders...');
      const data = await getOrdersByMeasurementStatus('e pamatur');
      console.log(`Fetched ${data.length} unmeasured orders`);
      setUnmeasuredOrders(data);
      return data;
    } catch (error) {
      console.error('Error fetching unmeasured orders:', error);
      setError('Gabim gjatë ngarkimit të porosive të pamatura');
      throw error;
    } finally {
      setUnmeasuredLoading(false);
    }
  };

  // Fetch measured orders
  const fetchMeasuredOrders = async () => {
    try {
      setMeasuredLoading(true);
      console.log('Fetching measured orders...');
      const data = await getOrdersByMeasurementStatus('e matur');
      console.log(`Fetched ${data.length} measured orders`);
      setMeasuredOrders(data);
      return data;
    } catch (error) {
      console.error('Error fetching measured orders:', error);
      setError('Gabim gjatë ngarkimit të porosive të matura');
      throw error;
    } finally {
      setMeasuredLoading(false);
    }
  };

  // Handle order measurement
  const handleOrderMeasurement = (order) => {
    setSelectedOrder(order);
    setMeasurementData({
      matesi: user?.emri ? `${user.emri} ${user.mbiemri}` : '',
      dataMatjes: format(new Date(), 'yyyy-MM-dd'),
      statusiMatjes: 'e matur'
    });
    setShowModal(true);
  };

  // Handle measurement form change
  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setMeasurementData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save measurement
  const handleSaveMeasurement = async () => {
    try {
      if (!selectedOrder) return;
      
      console.log(`Updating measurement status for order ${selectedOrder.id}...`);
      await updateMeasurementStatus(selectedOrder.id, measurementData);
      console.log(`Order ${selectedOrder.id} marked as measured successfully`);
      
      // Update the lists
      setUnmeasuredOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      
      // Refresh measured orders
      fetchMeasuredOrders();
      
      // Close modal
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating measurement status:', error);
      setError(`Gabim gjatë përditësimit të statusit të matjes: ${error.message || 'Gabim i panjohur'}`);
    }
  };

  // Filter orders based on search term
  const filterOrders = (orders) => {
    if (!searchTerm) return orders;
    
    return orders.filter(order => 
      order.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.numriTelefonit.includes(searchTerm) ||
      order.vendi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get measurement status badge
  const getMeasurementStatusBadge = (status) => {
    switch (status) {
      case 'e pamatur':
        return <Badge bg="warning">E Pamatur</Badge>;
      case 'e matur':
        return <Badge bg="success">E Matur</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Render orders table
  const renderOrdersTable = (orders, status, loading) => {
    const filteredOrders = filterOrders(orders);
    
    if (loading) {
      return (
        <div className="text-center p-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Duke ngarkuar porositë...</p>
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <Alert variant="info">
          Nuk u gjetën porosi {status === 'unmeasured' ? 'të pamatura' : 'të matura'}.
        </Alert>
      );
    }
    
    return (
      <Table hover responsive>
        <thead className="table-light">
          <tr>
            <th>Klienti</th>
            <th>Data e Porosisë</th>
            <th>Tipi i Porosisë</th>
            <th>Vendi</th>
            {status === 'measured' && <th>Matësi</th>}
            {status === 'measured' && <th>Data e Matjes</th>}
            <th>Statusi i Matjes</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id}>
              <td>
                <Link to={`/orders/edit/${order.id}`} className="text-decoration-none fw-bold">
                  {order.emriKlientit} {order.mbiemriKlientit}
                </Link>
                <div><small className="text-muted">{order.numriTelefonit}</small></div>
              </td>
              <td>{order.dita ? format(new Date(order.dita), 'dd/MM/yyyy') : 'N/A'}</td>
              <td>{order.tipiPorosise}</td>
              <td>{order.vendi}</td>
              {status === 'measured' && <td>{order.matesi || '—'}</td>}
              {status === 'measured' && <td>
                {order.dataMatjes ? format(new Date(order.dataMatjes), 'dd/MM/yyyy') : '—'}
              </td>}
              <td>{getMeasurementStatusBadge(order.statusiMatjes)}</td>
              <td>
                <div className="d-flex gap-2">
                  {status === 'unmeasured' ? (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleOrderMeasurement(order)}
                    >
                      Shëno si e Matur
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm"
                      as={Link}
                      to={`/orders/edit/${order.id}`}
                    >
                      Detaje
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Statusi i Matjeve</h3>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={fetchMeasurementData}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2 d-flex gap-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setError('');
                fetchMeasurementData();
              }}
            >
              Provo përsëri
            </Button>
            
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={async () => {
                try {
                  const success = await refreshAuth();
                  if (success) {
                    setError('');
                    fetchMeasurementData();
                  }
                } catch (err) {
                  console.error('Error refreshing authentication:', err);
                }
              }}
            >
              Rifresko sesionin
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h2 className="mb-0">{unmeasuredLoading ? <Spinner size="sm" animation="border" /> : unmeasuredOrders.length}</h2>
              <small>Porosi të Pamatura</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h2 className="mb-0">{measuredLoading ? <Spinner size="sm" animation="border" /> : measuredOrders.length}</h2>
              <small>Porosi të Matura</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Rulers className="me-2" size={20} />
              <h5 className="mb-0">Porositë sipas Statusit të Matjes</h5>
            </div>
            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text>
                <Search />
              </InputGroup.Text>
              <Form.Control
                placeholder="Kërko sipas emrit, vendit ose numrit"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="border-bottom mb-0"
          >
            <Tab eventKey="unmeasured" title={`Porosi të Pamatura (${unmeasuredOrders.length})`}>
              {renderOrdersTable(unmeasuredOrders, 'unmeasured', unmeasuredLoading)}
            </Tab>
            <Tab eventKey="measured" title={`Porosi të Matura (${measuredOrders.length})`}>
              {renderOrdersTable(measuredOrders, 'measured', measuredLoading)}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
      
      {/* Measurement Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Shëno Matjen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <div className="mb-3">
                <strong>Porosia:</strong> {selectedOrder.tipiPorosise} për {selectedOrder.emriKlientit} {selectedOrder.mbiemriKlientit}
              </div>
              <div className="mb-3">
                <strong>Vendi:</strong> {selectedOrder.vendi}
              </div>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Matësi</Form.Label>
                  <Form.Control
                    type="text"
                    name="matesi"
                    value={measurementData.matesi}
                    onChange={handleMeasurementChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Data e Matjes</Form.Label>
                  <Form.Control
                    type="date"
                    name="dataMatjes"
                    value={measurementData.dataMatjes}
                    onChange={handleMeasurementChange}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Anulo
          </Button>
          <Button variant="primary" onClick={handleSaveMeasurement}>
            Ruaj
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MeasurementStatusPage; 