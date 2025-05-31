import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { sq } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarEvent } from 'react-bootstrap-icons';
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
  
  // Get all days to display in calendar (including prev/next month days)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
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
  
  // Render capacity indicators
  const renderCapacityIndicators = (capacity) => {
    if (!capacity) return null;
    
    const dyerGarazhi = Math.max(0, capacity.dyerGarazhi || 0);
    const kapake = Math.max(0, capacity.kapake || 0);
    
    return (
      <div className="capacity-indicators">
        <div className="capacity-item">
          <span className="capacity-label">DG</span>
          <div className="capacity-dots">
            {Array.from({ length: Math.min(dyerGarazhi, 3) }, (_, i) => (
              <div key={`dg-${i}`} className="capacity-dot available" />
            ))}
            {dyerGarazhi > 3 && <span className="capacity-more">+{dyerGarazhi - 3}</span>}
          </div>
        </div>
        <div className="capacity-item">
          <span className="capacity-label">KG</span>
          <div className="capacity-dots">
            {Array.from({ length: Math.min(kapake, 3) }, (_, i) => (
              <div key={`kg-${i}`} className="capacity-dot available" />
            ))}
            {kapake > 3 && <span className="capacity-more">+{kapake - 3}</span>}
          </div>
        </div>
      </div>
    );
  };
  
  // Navigate to order form with selected date
  const handleDateClick = (day) => {
    if (!isSameMonth(day, currentMonth)) return; // Don't allow clicking on prev/next month days
    const formattedDay = format(day, 'yyyy-MM-dd');
    navigate('/orders/new', { state: { selectedDate: formattedDay } });
  };
  
  if (!isAuthenticated) {
    return (
      <div className="capacity-calendar-card">
        <div className="calendar-header">
          <CalendarEvent className="calendar-icon" />
          <h5>Kalendari i Kapaciteteve</h5>
        </div>
        <div className="unauthenticated-content">
          <Alert variant="warning" className="auth-alert">
            Ju duhet të jeni të loguar për të parë kalendarin e kapaciteteve.
          </Alert>
          <Button onClick={() => navigate('/login')} variant="primary" size="sm">
            Logohu
          </Button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="capacity-calendar-card">
        <div className="calendar-header">
          <CalendarEvent className="calendar-icon" />
          <h5>Kalendari i Kapaciteteve</h5>
        </div>
        <div className="loading-content">
          <Spinner animation="border" size="sm" />
          <p>Duke ngarkuar kalendarin...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="capacity-calendar-card">
        <div className="calendar-header">
          <CalendarEvent className="calendar-icon" />
          <h5>Kalendari i Kapaciteteve</h5>
        </div>
        <Alert variant="danger" className="error-alert">{error}</Alert>
      </div>
    );
  }
  
  return (
    <div className="capacity-calendar-card">
      <div className="calendar-header">
        <div className="header-left">
          <CalendarEvent className="calendar-icon" />
          <h5>Kalendari i Kapaciteteve</h5>
        </div>
        
        <div className="calendar-navigation">
          <button onClick={prevMonth} className="nav-btn">
            <ChevronLeft size={18} />
          </button>
          
          <h6 className="current-month">
            {format(currentMonth, 'MMMM yyyy', { locale: sq })}
          </h6>
          
          <button onClick={nextMonth} className="nav-btn">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div className="calendar-body">
        {/* Day headers */}
        <div className="calendar-grid">
          <div className="day-headers">
            {['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'].map((day) => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="calendar-days">
            {calendarDays.map((day) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const capacity = getCapacity(day);
              const hasCapacity = capacity && (capacity.dyerGarazhi > 0 || capacity.kapake > 0);
              const isFull = capacity && (capacity.dyerGarazhi === 0 && capacity.kapake === 0);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`calendar-day 
                    ${isToday ? 'today' : ''} 
                    ${!isCurrentMonth ? 'other-month' : ''} 
                    ${hasCapacity ? 'has-capacity' : ''} 
                    ${isFull ? 'is-full' : ''}
                    ${isCurrentMonth ? 'clickable' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  {isCurrentMonth && renderCapacityIndicators(capacity)}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-indicator">
              <div className="capacity-dot available"></div>
            </div>
            <span>Kapacitet i disponueshëm</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator today-indicator"></div>
            <span>Sot</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator full-indicator"></div>
            <span>I rezervuar plotësisht</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacityCalendar;