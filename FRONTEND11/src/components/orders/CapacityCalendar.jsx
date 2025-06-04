import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button, Modal, Badge, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, startOfWeek, endOfWeek, isAfter, isBefore, parseISO } from 'date-fns';
import { sq } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarEvent, 
  Person, 
  Phone, 
  GeoAlt, 
  DoorOpen, 
  CurrencyEuro, 
  Clock,
  ExclamationTriangleFill,
  Calendar3,
  ArrowRepeat,
  CheckCircleFill,
  InfoCircle,
  Bell,
  HandIndexThumb
} from 'react-bootstrap-icons';
import { getAllCapacities } from '../../services/capacityService';
import { updateOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import useOrderManagement from '../../hooks/useOrderManagement';
import './capacity.css';

const CapacityCalendar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [capacities, setCapacities] = useState([]);
  const [loadingCapacities, setLoadingCapacities] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Use the new order management hook
  const {
    orders,
    overdueOrders,
    loading: loadingOrders,
    error: orderError,
    fetchOrders,
    rescheduleOrderWithNotification,
    completeOrder,
    checkCapacityForDate,
    getOrdersForDay,
    getDayStatus
  } = useOrderManagement();
  
  // Orders modal state
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [ordersForDate, setOrdersForDate] = useState([]);
  
  // Rescheduling modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [orderToReschedule, setOrderToReschedule] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);
  
  // Drag and drop state
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
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
      setLoadingCapacities(false);
    }
  }, [isAuthenticated]);
  
  const fetchCapacities = async () => {
    try {
      setLoadingCapacities(true);
      const data = await getAllCapacities();
      setCapacities(data || []);
    } catch (err) {
      console.error('Error fetching capacities:', err);
      setError('Ka ndodhur një gabim gjatë marrjes së kapaciteteve');
    } finally {
      setLoadingCapacities(false);
    }
  };
  
  const showToastNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
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
  
  // Render capacity indicators with order status
  const renderCapacityIndicators = (capacity, day) => {
    const dayOrders = getOrdersForDay(day);
    const dayStatus = getDayStatus(day);
    
    return (
      <div className="capacity-indicators">
        {/* Order status indicator */}
        {dayOrders.length > 0 && (
          <div className="order-status-indicator">
            <div className={`order-status-square ${dayStatus}`}>
              <span className="order-count">{dayOrders.length}</span>
            </div>
          </div>
        )}
        
        {/* Capacity indicators */}
        {capacity && (
          <>
            <div className="capacity-item">
              <span className="capacity-label">DG</span>
              <div className="capacity-dots">
                {Array.from({ length: Math.min(capacity.dyerGarazhi || 0, 3) }, (_, i) => (
                  <div key={`dg-${i}`} className="capacity-dot available" />
                ))}
                {capacity.dyerGarazhi > 3 && <span className="capacity-more">+{capacity.dyerGarazhi - 3}</span>}
              </div>
            </div>
            <div className="capacity-item">
              <span className="capacity-label">KG</span>
              <div className="capacity-dots">
                {Array.from({ length: Math.min(capacity.kapake || 0, 3) }, (_, i) => (
                  <div key={`kg-${i}`} className="capacity-dot available" />
                ))}
                {capacity.kapake > 3 && <span className="capacity-more">+{capacity.kapake - 3}</span>}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Handle date click - show orders or navigate to new order
  const handleDateClick = async (day) => {
    if (!isSameMonth(day, currentMonth)) return; // Don't allow clicking on prev/next month days
    
    const formattedDay = format(day, 'yyyy-MM-dd');
    const dayOrders = getOrdersForDay(day);
    
    if (dayOrders.length > 0) {
      // Show orders for this day
      setSelectedDate(formattedDay);
      setOrdersForDate(dayOrders);
      setShowOrdersModal(true);
    } else {
      // Navigate to new order form with selected date
    navigate('/orders/new', { state: { selectedDate: formattedDay } });
    }
  };
  
  // Handle order rescheduling
  const handleRescheduleOrder = async (order) => {
    setOrderToReschedule(order);
    
    try {
      // Get available dates with capacity
      const availableDates = [];
      for (const capacity of capacities) {
        if (capacity.dyerGarazhi > 0 || capacity.kapake > 0) {
          // Check if date has conflicts
          try {
            const capacityCheck = await checkCapacityForDate(capacity.dita, order.tipiPorosise);
            if (capacityCheck.hasCapacity) {
              availableDates.push(capacity.dita);
            }
          } catch (error) {
            console.warn(`Could not check capacity for ${capacity.dita}:`, error);
            // Still include the date if we can't check capacity
            availableDates.push(capacity.dita);
          }
        }
      }
      
      setAvailableDates(availableDates);
      setShowRescheduleModal(true);
    } catch (error) {
      console.error('Error preparing reschedule modal:', error);
      showToastNotification('Gabim gjatë përgatitjes së riplanifikimit', 'danger');
    }
  };
  
  // Execute order rescheduling
  const executeReschedule = async (newDate) => {
    if (!orderToReschedule) return;
    
    try {
      setRescheduling(true);
      
      console.log('Attempting to reschedule order:', {
        orderId: orderToReschedule.id,
        oldDate: orderToReschedule.dita,
        newDate: newDate
      });
      
      const result = await rescheduleOrderWithNotification(
        orderToReschedule.id, 
        newDate, 
        'Riplanifikuar nga kalendari për shkak vonese'
      );
      
      setShowRescheduleModal(false);
      setOrderToReschedule(null);
      
      // Show success message (database save is guaranteed at this point)
      showToastNotification(
        `Sukses! Porosia për ${orderToReschedule.emriKlientit} ${orderToReschedule.mbiemriKlientit} u riplanifikua dhe u ruajt në bazën e të dhënave.`,
        'success'
      );
      
      // Refresh orders for current modal if open
      if (showOrdersModal && selectedDate) {
        const updatedOrders = getOrdersForDay(parseISO(selectedDate));
        setOrdersForDate(updatedOrders);
      }
      
    } catch (error) {
      console.error('Error rescheduling order:', error);
      
      // Show clear error message when operation fails
      let errorMessage = 'Gabim gjatë riplanifikimit të porosisë';
      
      if (error.message.includes('ka kapacitet')) {
        errorMessage = error.message;
      } else if (error.message.includes('nuk u gjet')) {
        errorMessage = 'Porosia nuk u gjet në sistem';
      } else if (error.message.includes('bazën e të dhënave')) {
        errorMessage = error.message; // Use the detailed error message from the hook
      } else {
        errorMessage = `Problem me riplanifikimin: ${error.message}`;
      }
      
      showToastNotification(errorMessage, 'danger');
    } finally {
      setRescheduling(false);
    }
  };
  
  // Drag and Drop handlers (using same logic as EditOrder form)
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Add a visual indicator
    e.target.style.opacity = '0.5';
    
    showToastNotification(`Tërhiqni porosinë për ${order.emriKlientit} ${order.mbiemriKlientit} në një datë të re`, 'info');
  };

  const handleDragEnd = (e) => {
    setDraggedOrder(null);
    setDragOverDate(null);
    setIsDragging(false);
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (isSameMonth(day, currentMonth)) {
      const formattedDay = format(day, 'yyyy-MM-dd');
      setDragOverDate(formattedDay);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the day cell, not just a child element
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverDate(null);
  };

  const handleDrop = async (e, day) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedOrder || !isSameMonth(day, currentMonth)) {
      showToastNotification('Gabim: Nuk mund të riplanifikohet porosia në këtë datë', 'danger');
      return;
    }
    
    const newDate = format(day, 'yyyy-MM-dd');
    const oldDate = draggedOrder.dita;
    
    // Don't do anything if dropping on the same date
    if (newDate === oldDate) {
      showToastNotification('Porosia është tashmë në këtë datë', 'warning');
      return;
    }
    
    try {
      // Check capacity for the new date (same as EditOrder logic)
      try {
        const capacityCheck = await checkCapacityForDate(newDate, draggedOrder.tipiPorosise);
        
        if (!capacityCheck.hasCapacity) {
          showToastNotification(
            `Paralajmërim: Data ${format(parseISO(newDate), 'dd/MM/yyyy', { locale: sq })} nuk ka kapacitet të mjaftueshëm për ${draggedOrder.tipiPorosise}. Vazhuan megjithatë...`,
            'warning'
          );
        }
      } catch (capacityError) {
        console.warn('Capacity check failed, proceeding with rescheduling:', capacityError);
      }
      
      // Use the same update logic as EditOrder form
      const updatedOrderData = { ...draggedOrder, dita: newDate };
      
      // Save directly to database using updateOrder (same as EditOrder)
      await updateOrder(draggedOrder.id, updatedOrderData);
      
      showToastNotification(
        `Sukses! Porosia për ${draggedOrder.emriKlientit} ${draggedOrder.mbiemriKlientit} u riplanifikua nga ${format(parseISO(oldDate), 'dd/MM/yyyy', { locale: sq })} në ${format(parseISO(newDate), 'dd/MM/yyyy', { locale: sq })}`,
        'success'
      );
      
      // Refresh orders for current modal if open
      if (showOrdersModal && selectedDate) {
        const updatedOrders = getOrdersForDay(parseISO(selectedDate));
        setOrdersForDate(updatedOrders);
      }
      
      // Force refresh the orders in the hook (this should trigger a re-fetch)
      fetchOrders(); // Use the new fetchOrders function from the hook
      
    } catch (error) {
      console.error('Error during drag and drop reschedule:', error);
      showToastNotification(
        `Gabim: Nuk mund të ruhet data e re në bazën e të dhënave. ${error.message}`,
        'danger'
      );
    }
  };
  
  // Handle order completion
  const handleCompleteOrder = async (order) => {
    try {
      console.log('Attempting to complete order:', order.id);
      
      const result = await completeOrder(order.id, {
        completedBy: 'user', // You might want to get this from auth context
        completionNotes: 'Shënuar si e përfunduar nga kalendari'
      });
      
      // Show success message (database save is guaranteed at this point)
      showToastNotification(
        `Sukses! Porosia për ${order.emriKlientit} ${order.mbiemriKlientit} u shënua si e përfunduar dhe u ruajt në bazën e të dhënave.`,
        'success'
      );
      
      // Refresh orders for current modal
      if (showOrdersModal && selectedDate) {
        const updatedOrders = getOrdersForDay(parseISO(selectedDate));
        setOrdersForDate(updatedOrders);
      }
      
    } catch (error) {
      console.error('Error completing order:', error);
      
      // Show clear error message when operation fails
      let errorMessage = 'Gabim gjatë shënimit të porosisë si e përfunduar';
      
      if (error.message.includes('nuk u gjet')) {
        errorMessage = 'Porosia nuk u gjet në sistem';
      } else if (error.message.includes('bazën e të dhënave')) {
        errorMessage = error.message; // Use the detailed error message from the hook
      } else {
        errorMessage = `Problem me shënimin si e përfunduar: ${error.message}`;
      }
      
      showToastNotification(errorMessage, 'danger');
    }
  };
  
  // Get status badge for order
  const getStatusBadge = (order) => {
    switch (order.statusi) {
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'në proces':
        return <Badge bg="warning">Në Proces</Badge>;
      default:
        return <Badge bg="secondary">{order.statusi}</Badge>;
    }
  };
  
  const loading = loadingCapacities || loadingOrders;
  const combinedError = error || orderError;
  
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
  
  if (combinedError) {
    return (
      <div className="capacity-calendar-card">
        <div className="calendar-header">
          <CalendarEvent className="calendar-icon" />
          <h5>Kalendari i Kapaciteteve</h5>
        </div>
        <Alert variant="danger" className="error-alert">{combinedError}</Alert>
      </div>
    );
  }
  
  return (
    <>
      <div className="capacity-calendar-card">
        <div className="calendar-header">
          <div className="header-left">
            <CalendarEvent className="calendar-icon" />
            <h5>Kalendari i Kapaciteteve</h5>
            {overdueOrders.length > 0 && (
              <Badge bg="warning" className="ms-2">
                <Bell size={12} className="me-1" />
                {overdueOrders.length} vonesa
              </Badge>
            )}
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
          <div className={`calendar-grid ${isDragging ? 'drag-active' : ''}`}>
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
                const dayOrders = getOrdersForDay(day);
                const dayStatus = getDayStatus(day);
            const hasCapacity = capacity && (capacity.dyerGarazhi > 0 || capacity.kapake > 0);
            const isFull = capacity && (capacity.dyerGarazhi === 0 && capacity.kapake === 0);
            const formattedDay = format(day, 'yyyy-MM-dd');
            const isDragOver = dragOverDate === formattedDay;
            
                return (
                  <div 
                    key={day.toString()} 
                    className={`calendar-day 
                      ${isToday ? 'today' : ''} 
                      ${!isCurrentMonth ? 'other-month' : ''} 
                      ${hasCapacity ? 'has-capacity' : ''} 
                      ${isFull ? 'is-full' : ''}
                      ${isCurrentMonth ? 'clickable' : ''}
                      ${dayStatus === 'scheduled' ? 'has-orders' : ''}
                      ${dayStatus === 'overdue' ? 'has-overdue' : ''}
                      ${dayStatus === 'completed' ? 'has-completed' : ''}
                      ${isDragOver ? 'drag-over' : ''}
                      ${isDragging ? 'drag-active' : ''}
                    `}
                    onClick={() => handleDateClick(day)}
                    onDragOver={(e) => handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="day-number">{format(day, 'd')}</div>
                    {isCurrentMonth && renderCapacityIndicators(capacity, day)}
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
              <div className="legend-indicator order-scheduled-indicator"></div>
              <span>Porosi të planifikuara</span>
            </div>
            <div className="legend-item">
              <div className="legend-indicator order-overdue-indicator"></div>
              <span>Porosi të vonuara</span>
            </div>
            <div className="legend-item">
              <div className="legend-indicator full-indicator"></div>
              <span>I rezervuar plotësisht</span>
            </div>
            <div className="legend-item">
              <HandIndexThumb className="me-1" size={14} />
              <span>Tërhiq porosinë për riplanifikim</span>
            </div>
          </div>
                          </div>
                        </div>

      {/* Orders Modal */}
      <Modal show={showOrdersModal} onHide={() => setShowOrdersModal(false)} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <CalendarEvent className="me-2 text-primary" />
            Porositë për {selectedDate ? format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: sq }) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {ordersForDate.length > 0 ? (
            <div className="orders-list">
              {ordersForDate.map((order) => (
                <div 
                  key={order.id} 
                  className={`order-card ${isDragging && draggedOrder?.id === order.id ? 'being-dragged' : ''}`}
                  draggable={order.statusi !== 'e përfunduar'}
                  onDragStart={(e) => handleDragStart(e, order)}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    cursor: order.statusi !== 'e përfunduar' ? 'grab' : 'default',
                    opacity: isDragging && draggedOrder?.id === order.id ? 0.5 : 1
                  }}
                  title={order.statusi !== 'e përfunduar' ? 'Tërhiq për të riplanifikuar' : 'Porosia është e përfunduar'}
                >
                  <div className="order-header">
                    <div className="customer-info">
                      <h6 className="customer-name">
                        {order.statusi !== 'e përfunduar' && (
                          <HandIndexThumb className="me-2 text-muted" size={14} />
                        )}
                        <Person className="me-2" size={16} />
                        {order.emriKlientit} {order.mbiemriKlientit}
                      </h6>
                      <div className="order-badge">
                        {getStatusBadge(order)}
                      </div>
                    </div>
                    <div className="order-actions">
                      <div className="order-id">#{order.id}</div>
                      <div className="action-buttons">
                        {order.statusi !== 'e përfunduar' && getDayStatus(parseISO(selectedDate)) === 'overdue' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleRescheduleOrder(order)}
                            className="me-2"
                          >
                            <ArrowRepeat className="me-1" size={14} />
                            Riplanifiko
                          </Button>
                        )}
                        {order.statusi !== 'e përfunduar' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleCompleteOrder(order)}
                          >
                            <CheckCircleFill className="me-1" size={14} />
                            Përfundo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="detail-item">
                      <Phone size={14} className="me-2 text-muted" />
                      <span>{order.numriTelefonit}</span>
                    </div>
                    <div className="detail-item">
                      <GeoAlt size={14} className="me-2 text-muted" />
                      <span>{order.vendi}</span>
                    </div>
                    <div className="detail-item">
                      <DoorOpen size={14} className="me-2 text-muted" />
                      <span>{order.tipiPorosise}</span>
                    </div>
                    <div className="detail-item">
                      <CurrencyEuro size={14} className="me-2 text-muted" />
                      <span>{order.cmimiTotal}€ (Kaparja: {order.kaparja}€)</span>
                        </div>
                    {order.shitesi && (
                      <div className="detail-item">
                        <Person size={14} className="me-2 text-muted" />
                        <span>Shitësi: {order.shitesi}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
                      </div>
          ) : (
            <div className="empty-state">
              <Calendar3 size={48} className="text-muted mb-3" />
              <h5>Nuk ka porosi</h5>
              <p className="text-muted">Nuk ka porosi të regjistruara për këtë ditë.</p>
                    </div>
                  )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button variant="outline-secondary" onClick={() => setShowOrdersModal(false)}>
            Mbyll
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <ArrowRepeat className="me-2 text-warning" />
            Riplanifiko Porosinë
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {orderToReschedule && (
            <div>
              <div className="alert alert-warning">
                <ExclamationTriangleFill className="me-2" />
                <strong>Porosi e vonuar:</strong> {orderToReschedule.emriKlientit} {orderToReschedule.mbiemriKlientit}
                <br />
                <small>Data origjinale: {format(parseISO(orderToReschedule.dita), 'dd/MM/yyyy', { locale: sq })}</small>
                </div>
              
              <h6>
                <InfoCircle className="me-2" />
                Zgjidhni një datë të re me kapacitet të disponueshëm:
              </h6>
              <div className="available-dates">
                {availableDates.length > 0 ? (
                  <ListGroup>
                    {availableDates.slice(0, 10).map(date => (
                      <ListGroup.Item 
                        key={date} 
                        action 
                        onClick={() => executeReschedule(date)}
                        disabled={rescheduling}
                        className="d-flex align-items-center justify-content-between"
                      >
                        <div>
                          <Calendar3 className="me-2" />
                          {format(parseISO(date), 'dd/MM/yyyy EEEE', { locale: sq })}
          </div>
                        {rescheduling && (
                          <Spinner animation="border" size="sm" />
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">
                    <InfoCircle className="me-2" />
                    Nuk ka data të disponueshme për riplanifikim. Ju lutemi kontaktoni administratorin për të shtuar më shumë kapacitet.
                  </Alert>
                )}
          </div>
        </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowRescheduleModal(false)}
            disabled={rescheduling}
          >
            Anulo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer className="position-fixed" style={{ top: '20px', right: '20px', zIndex: 9999 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={4000} 
          autohide
          bg={toastVariant}
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto text-white">
              {toastVariant === 'success' ? 'Sukses' : toastVariant === 'danger' ? 'Gabim' : 'Informacion'}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default CapacityCalendar;