import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { sq } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getAllCapacities } from '../../services/capacityService';
import { useAuth } from '../../context/AuthContext';
import './capacity.css';

const CapacityCalendar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get days of current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Fetch capacities
  useEffect(() => {
    if (isAuthenticated) {
      fetchCapacities();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  const fetchCapacities = async () => {
    try {
      setLoading(true);
      const data = await getAllCapacities();
      setCapacities(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching capacities:', err);
      setError('Ka ndodhur një gabim gjatë marrjes së kapaciteteve');
      setLoading(false);
    }
  };
  
  // Go to previous month
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  // Go to next month
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  
  // Get capacity for a specific day
  const getCapacity = (day) => {
    try {
      const formattedDay = format(day, 'yyyy-MM-dd');
      return capacities.find(c => c.dita === formattedDay) || null;
    } catch (error) {
      console.error('Error getting capacity for day:', error);
      return null;
    }
  };
  
  // Render capacity boxes
  const renderCapacityBoxes = (capacity, type) => {
    if (!capacity || capacity[type] === undefined || capacity[type] === null) return null;
    
    // Use capacity value directly without assuming a fixed total
    const available = Math.max(0, capacity[type]); // Ensure available is at least 0
    
    return (
      <div className="d-flex gap-1 justify-content-center mt-1 flex-wrap">
        {Array.from({ length: available }, (_, i) => (
          <div 
            key={`${type}-available-${i}`}
            className="capacity-square available"
          />
        ))}
      </div>
    );
  };
  
  // Navigate to order form with selected date
  const handleDateClick = (day) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    navigate('/orders/new', { state: { selectedDate: formattedDay } });
  };
  
  if (!isAuthenticated) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center p-4">
          <Alert variant="warning">
            Ju duhet të jeni të loguar për të parë kalendarin e kapaciteteve.
          </Alert>
          <Button onClick={() => navigate('/login')} variant="primary">
            Logohu
          </Button>
        </Card.Body>
      </Card>
    );
  }
  
  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center p-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Duke ngarkuar kalendarin e kapaciteteve...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
        <button 
          onClick={prevMonth} 
          className="btn btn-sm btn-outline-secondary"
        >
          &lt;
        </button>
        
        <h5 className="mb-0">
          {format(currentMonth, 'MMMM yyyy', { locale: sq })}
        </h5>
        
        <button 
          onClick={nextMonth} 
          className="btn btn-sm btn-outline-secondary"
        >
          &gt;
        </button>
      </Card.Header>
      
      <Card.Body className="p-2">
        <Row className="mb-2">
          <Col className="text-center p-2">Hën</Col>
          <Col className="text-center p-2">Mar</Col>
          <Col className="text-center p-2">Mër</Col>
          <Col className="text-center p-2">Enj</Col>
          <Col className="text-center p-2">Pre</Col>
          <Col className="text-center p-2">Sht</Col>
          <Col className="text-center p-2">Die</Col>
        </Row>
        
        <Row>
          {daysInMonth.map((day, i) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const capacity = getCapacity(day);
            const hasCapacity = capacity && (capacity.dyerGarazhi > 0 || capacity.kapake > 0);
            const isFull = capacity && (capacity.dyerGarazhi === 0 && capacity.kapake === 0);
            
            // Adjust for week start (Sunday)
            if (i === 0) {
              const dayOfWeek = day.getDay();
              const emptyCells = Array.from({ length: dayOfWeek }, (_, i) => (
                <Col key={`empty-${i}`} className="p-0"></Col>
              ));
              if (emptyCells.length > 0) {
                return [
                  ...emptyCells,
                  <Col 
                    key={day.toString()} 
                    className={`p-0 ${isCurrentMonth ? '' : 'text-muted'}`}
                  >
                    <div 
                      className={`calendar-day d-flex flex-column p-2 ${isToday ? 'today' : ''} ${hasCapacity ? 'has-capacity' : ''} ${isFull ? 'is-full' : ''}`}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        backgroundColor: isToday ? '#f8f9fa' : '',
                        height: '90px'
                      }}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="text-center fw-bold">{format(day, 'd')}</div>
                      
                      {capacity && (
                        <div className="mt-auto">
                          <div className="tiny-text" style={{ fontSize: '10px' }}>
                            <div>DG: {capacity.dyerGarazhi}</div>
                            {renderCapacityBoxes(capacity, 'dyerGarazhi')}
                            <div>K: {capacity.kapake}</div>
                            {renderCapacityBoxes(capacity, 'kapake')}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                ];
              }
            }
            
            // Handle row breaks
            if (day.getDay() === 0 && i > 0) {
              return [
                <div key={`break-${i}`} className="w-100"></div>,
                <Col 
                  key={day.toString()} 
                  className={`p-0 ${isCurrentMonth ? '' : 'text-muted'}`}
                >
                  <div 
                    className={`calendar-day d-flex flex-column p-2 ${isToday ? 'today' : ''} ${hasCapacity ? 'has-capacity' : ''} ${isFull ? 'is-full' : ''}`}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      backgroundColor: isToday ? '#f8f9fa' : '',
                      height: '90px'
                    }}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="text-center fw-bold">{format(day, 'd')}</div>
                    
                    {capacity && (
                      <div className="mt-auto">
                        <div className="tiny-text" style={{ fontSize: '10px' }}>
                          <div>DG: {capacity.dyerGarazhi}</div>
                          {renderCapacityBoxes(capacity, 'dyerGarazhi')}
                          <div>K: {capacity.kapake}</div>
                          {renderCapacityBoxes(capacity, 'kapake')}
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              ];
            }
            
            return (
              <Col 
                key={day.toString()} 
                className={`p-0 ${isCurrentMonth ? '' : 'text-muted'}`}
              >
                <div 
                  className={`calendar-day d-flex flex-column p-2 ${isToday ? 'today' : ''} ${hasCapacity ? 'has-capacity' : ''} ${isFull ? 'is-full' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    backgroundColor: isToday ? '#f8f9fa' : '',
                    height: '90px'
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-center fw-bold">{format(day, 'd')}</div>
                  
                  {capacity && (
                    <div className="mt-auto">
                      <div className="tiny-text" style={{ fontSize: '10px' }}>
                        <div>DG: {capacity.dyerGarazhi}</div>
                        {renderCapacityBoxes(capacity, 'dyerGarazhi')}
                        <div>K: {capacity.kapake}</div>
                        {renderCapacityBoxes(capacity, 'kapake')}
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
        
        <div className="mt-3">
          <div className="d-flex align-items-center mb-2">
            <div className="capacity-square available mr-2"></div>
            <span>Kapacitet i disponueshëm</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="capacity-square used mr-2"></div>
            <span>Kapacitet i përdorur</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CapacityCalendar;