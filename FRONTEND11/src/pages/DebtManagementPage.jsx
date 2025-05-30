import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { Search, CurrencyExchange } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { getCashDebtOrders, getBankDebtOrders, updatePaymentStatus, getDebtStatistics, getSupplementaryCashDebtOrders, getSupplementaryBankDebtOrders } from '../services/orderService';
import { updateSupplementaryOrderPaymentStatus } from '../services/supplementaryOrderService';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const DebtManagementPage = () => {
  const [cashDebts, setCashDebts] = useState([]);
  const [bankDebts, setBankDebts] = useState([]);
  const [suppCashDebts, setSuppCashDebts] = useState([]);
  const [suppBankDebts, setSuppBankDebts] = useState([]);
  const [cashLoading, setCashLoading] = useState(true);
  const [bankLoading, setBankLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cash');
  const [statistics, setStatistics] = useState({
    cashDebtCount: 0,
    bankDebtCount: 0,
    totalDebtCount: 0,
    totalCashDebt: 0,
    totalBankDebt: 0,
    totalDebt: 0
  });
  const { isAuthenticated, refreshAuth } = useAuth();

  // Fetch debt data on component mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDebtData();
    }
  }, [isAuthenticated]);

  // Fetch all debt data
  const fetchDebtData = async () => {
    try {
      console.log('Fetching debt data...');
      setError('');
      
      // Fetch all data in parallel
      await Promise.all([
        fetchCashDebts(),
        fetchBankDebts(),
        fetchSupplementaryCashDebts(),
        fetchSupplementaryBankDebts(),
        fetchDebtStatistics()
      ]);
      
      console.log('All debt data fetched successfully');
    } catch (err) {
      console.error('Error in fetchDebtData:', err);
      setError(`Gabim gjatë ngarkimit të të dhënave: ${err.message || 'Gabim i panjohur'}`);
    }
  };

  // Fetch cash debts
  const fetchCashDebts = async () => {
    try {
      setCashLoading(true);
      console.log('Fetching cash debts...');
      const data = await getCashDebtOrders();
      console.log(`Fetched ${data.length} cash debts`);
      setCashDebts(data);
      return data;
    } catch (error) {
      console.error('Error fetching cash debts:', error);
      setError('Gabim gjatë ngarkimit të borxheve në kesh');
      throw error;
    } finally {
      setCashLoading(false);
    }
  };

  // Fetch bank debts
  const fetchBankDebts = async () => {
    try {
      setBankLoading(true);
      console.log('Fetching bank debts...');
      const data = await getBankDebtOrders();
      console.log(`Fetched ${data.length} bank debts`);
      setBankDebts(data);
      return data;
    } catch (error) {
      console.error('Error fetching bank debts:', error);
      setError('Gabim gjatë ngarkimit të borxheve në bankë');
      throw error;
    } finally {
      setBankLoading(false);
    }
  };

  // Fetch supplementary cash debts
  const fetchSupplementaryCashDebts = async () => {
    try {
      console.log('Fetching supplementary cash debts...');
      const data = await getSupplementaryCashDebtOrders();
      console.log(`Fetched ${data.length} supplementary cash debts`);
      setSuppCashDebts(data);
      return data;
    } catch (error) {
      console.error('Error fetching supplementary cash debts:', error);
      setError('Gabim gjatë ngarkimit të borxheve shtesë në kesh');
      throw error;
    }
  };

  // Fetch supplementary bank debts
  const fetchSupplementaryBankDebts = async () => {
    try {
      console.log('Fetching supplementary bank debts...');
      const data = await getSupplementaryBankDebtOrders();
      console.log(`Fetched ${data.length} supplementary bank debts`);
      setSuppBankDebts(data);
      return data;
    } catch (error) {
      console.error('Error fetching supplementary bank debts:', error);
      setError('Gabim gjatë ngarkimit të borxheve shtesë në bankë');
      throw error;
    }
  };

  // Fetch debt statistics
  const fetchDebtStatistics = async () => {
    try {
      setStatsLoading(true);
      console.log('Fetching debt statistics...');
      const data = await getDebtStatistics();
      console.log('Debt statistics:', data);
      setStatistics(data);
      return data;
    } catch (error) {
      console.error('Error fetching debt statistics:', error);
      // Don't set error state here to avoid overriding more important errors
      throw error;
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle marking debt as paid
  const handleMarkAsPaid = async (id, debtType, isSupplementary = false) => {
    try {
      setError('');
      console.log(`Marking ${isSupplementary ? 'supplementary ' : ''}order ${id} as paid (${debtType})...`);
      
      if (isSupplementary) {
        await updateSupplementaryOrderPaymentStatus(id, true);
      } else {
        await updatePaymentStatus(id, true);
      }
      
      console.log(`${isSupplementary ? 'Supplementary ' : ''}Order ${id} marked as paid successfully`);
      
      // Update the appropriate list based on debt type and order type
      if (debtType === 'kesh') {
        if (isSupplementary) {
          setSuppCashDebts(prev => prev.filter(debt => debt.id !== id));
        } else {
          setCashDebts(prev => prev.filter(debt => debt.id !== id));
        }
      } else {
        if (isSupplementary) {
          setSuppBankDebts(prev => prev.filter(debt => debt.id !== id));
        } else {
          setBankDebts(prev => prev.filter(debt => debt.id !== id));
        }
      }
      
      // Refresh statistics
      fetchDebtStatistics();
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(`Gabim gjatë përditësimit të statusit të pagesës: ${error.message || 'Gabim i panjohur'}`);
    }
  };

  // Filter debts based on search term
  const filterDebts = (debts) => {
    if (!searchTerm) return debts;
    
    return debts.filter(debt => 
      debt.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.numriTelefonit.includes(searchTerm) ||
      debt.vendi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Render debt table
  const renderDebtTable = (debts, suppDebts, debtType, loading) => {
    // Combine main orders and supplementary orders
    const combinedDebts = [
      ...debts.map(debt => ({ ...debt, isSupplementary: false })),
      ...suppDebts.map(suppDebt => ({ 
        ...suppDebt, 
        isSupplementary: true,
        // Map supplementary order fields to match main order structure
        emriKlientit: suppDebt.emriKlientit,
        mbiemriKlientit: suppDebt.mbiemriKlientit,
        numriTelefonit: suppDebt.numriTelefonit,
        vendi: suppDebt.vendi,
        cmimiTotal: suppDebt.cmimiTotal,
        kaparja: suppDebt.kaparja,
        tipiPorosise: 'Porosi Shtesë',
        dita: suppDebt.ParentOrder?.OrderDetails?.dita || suppDebt.createdAt
      }))
    ];
    
    const filteredDebts = filterDebts(combinedDebts);
    
    if (loading) {
      return (
        <div className="text-center p-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Duke ngarkuar borxhet...</p>
        </div>
      );
    }

    if (filteredDebts.length === 0) {
      return (
        <Alert variant="info">
          Nuk u gjetën borxhe {debtType === 'kesh' ? 'në kesh' : 'në bankë'}.
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
            <th>Çmimi Total</th>
            <th>Kapari</th>
            <th>Mbetja</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredDebts.map(debt => {
            const remaining = debt.isSupplementary ? 
              parseFloat(debt.pagesaMbetur || 0) : 
              parseFloat(debt.cmimiTotal) - parseFloat(debt.kaparja);
            
            return (
              <tr key={`${debt.isSupplementary ? 'supp' : 'main'}-${debt.id}`}>
                <td>
                  {debt.isSupplementary ? (
                    <div>
                      <span className="fw-bold">{debt.emriKlientit} {debt.mbiemriKlientit}</span>
                      <Badge bg="info" className="ms-2" size="sm">Shtesë</Badge>
                      <div><small className="text-muted">{debt.numriTelefonit}</small></div>
                      <div><small className="text-muted">{debt.vendi}</small></div>
                      <div><small className="text-muted">Porosia Kryesore: #{debt.parentOrderId}</small></div>
                    </div>
                  ) : (
                    <div>
                      <Link to={`/orders/edit/${debt.id}`} className="text-decoration-none fw-bold">
                        {debt.emriKlientit} {debt.mbiemriKlientit}
                      </Link>
                      <div><small className="text-muted">{debt.numriTelefonit}</small></div>
                      <div><small className="text-muted">{debt.vendi}</small></div>
                    </div>
                  )}
                </td>
                <td>{debt.dita ? format(new Date(debt.dita), 'dd/MM/yyyy') : 'N/A'}</td>
                <td>
                  {debt.isSupplementary ? (
                    <div>
                      <Badge bg="secondary">Porosi Shtesë</Badge>
                      <div><small className="text-muted">{debt.pershkrimiProduktit}</small></div>
                    </div>
                  ) : debt.tipiPorosise}
                </td>
                <td>{parseFloat(debt.cmimiTotal).toFixed(2)} €</td>
                <td>{parseFloat(debt.kaparja || 0).toFixed(2)} €</td>
                <td><Badge bg="danger">{remaining.toFixed(2)} €</Badge></td>
                <td>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handleMarkAsPaid(debt.id, debtType, debt.isSupplementary)}
                    >
                      Paguaj
                    </Button>
                    {debt.isSupplementary ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => window.open(`/orders/additional`, '_blank')}
                      >
                        Detaje
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        as={Link}
                        to={`/orders/edit/${debt.id}`}
                      >
                        Detaje
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="table-secondary">
          <tr>
            <td colSpan="5" className="text-end fw-bold">Totali i Borxheve:</td>
            <td colSpan="2">
              <Badge bg="danger" style={{ fontSize: '1rem' }}>
                {debtType === 'kesh' ? 
                  parseFloat(statistics.totalCombinedCashDebt || 0).toFixed(2) : 
                  parseFloat(statistics.totalCombinedBankDebt || 0).toFixed(2)} €
              </Badge>
            </td>
          </tr>
        </tfoot>
      </Table>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Menaxhimi i Borxheve</h3>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={fetchDebtData}
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
                fetchDebtData();
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
                    fetchDebtData();
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
        <Col md={3}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <h2 className="mb-0">
                {statsLoading ? <Spinner size="sm" animation="border" /> : 
                  (statistics.cashDebtCount + statistics.suppCashDebtCount)}
              </h2>
              <small>Borxhe në Kesh</small>
              {!statsLoading && (
                <div className="mt-1">
                  <small className="text-muted">
                    Kryesore: {statistics.cashDebtCount} | Shtesë: {statistics.suppCashDebtCount}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <h2 className="mb-0">
                {statsLoading ? <Spinner size="sm" animation="border" /> : 
                  (statistics.bankDebtCount + statistics.suppBankDebtCount)}
              </h2>
              <small>Borxhe në Bankë</small>
              {!statsLoading && (
                <div className="mt-1">
                  <small className="text-muted">
                    Kryesore: {statistics.bankDebtCount} | Shtesë: {statistics.suppBankDebtCount}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 text-primary">
            <Card.Body>
              <h2 className="mb-0">{statsLoading ? <Spinner size="sm" animation="border" /> : statistics.totalDebtCount}</h2>
              <small>Numri Total i Borxheve</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 text-danger">
            <Card.Body>
              <h2 className="mb-0">
                {statsLoading ? 
                  <Spinner size="sm" animation="border" /> : 
                  parseFloat(statistics.totalDebt).toFixed(2) + ' €'}
              </h2>
              <small>Vlera Totale e Borxheve</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <CurrencyExchange className="me-2" size={20} />
              <h5 className="mb-0">Borxhet</h5>
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
            <Tab eventKey="cash" title={`Borxhe në Kesh (${(statistics.cashDebtCount || 0) + (statistics.suppCashDebtCount || 0)})`}>
              {renderDebtTable(cashDebts, suppCashDebts, 'kesh', cashLoading)}
            </Tab>
            <Tab eventKey="bank" title={`Borxhe në Bankë (${(statistics.bankDebtCount || 0) + (statistics.suppBankDebtCount || 0)})`}>
              {renderDebtTable(bankDebts, suppBankDebts, 'banke', bankLoading)}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DebtManagementPage; 