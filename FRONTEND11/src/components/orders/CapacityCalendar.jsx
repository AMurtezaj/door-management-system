import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button, Modal, Badge, ListGroup, Toast, ToastContainer, Row, Col, ProgressBar } from 'react-bootstrap';
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
  HandIndexThumb,
  Tools,
  FileText
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
  
  // Add state for order details modal
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  
  // Add state for order swapping functionality
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapSourceOrder, setSwapSourceOrder] = useState(null);
  const [swapTargetDate, setSwapTargetDate] = useState('');
  const [availableOrdersForSwap, setAvailableOrdersForSwap] = useState([]);
  const [swapping, setSwapping] = useState(false);
  const [swapSearchTerm, setSwapSearchTerm] = useState('');
  
  // Add completing state for order completion
  const [completing, setCompleting] = useState(false);
  
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
    const capacity = getCapacity(day);
    
    // Always show the orders modal, even if no orders exist
    setSelectedDate(formattedDay);
    setOrdersForDate(dayOrders);
    setShowOrdersModal(true);
  };
  
  // Safe date parsing helper
  const safeParseDate = (dateString) => {
    if (!dateString) return null;
    try {
      // Handle different date formats
      let parsed;
      
      // If it's already a Date object
      if (dateString instanceof Date) {
        parsed = dateString;
      }
      // If it's a string in ISO format
      else if (typeof dateString === 'string') {
        // Try parseISO first (for ISO strings like "2024-06-16")
        parsed = parseISO(dateString);
        
        // If parseISO fails, try new Date()
        if (isNaN(parsed.getTime())) {
          parsed = new Date(dateString);
        }
      }
      // If it's a number (timestamp)
      else if (typeof dateString === 'number') {
        parsed = new Date(dateString);
      }
      else {
        return null;
      }
      
      // Check if the parsed date is valid
      if (isNaN(parsed.getTime())) return null;
      return parsed;
    } catch (error) {
      console.warn('Invalid date string:', dateString, error);
      return null;
    }
  };

  // Safe date formatting helper with better order date detection
  const safeFormatDate = (dateInput, formatStr = 'dd/MM/yyyy', options = { locale: sq }) => {
    // If dateInput is an order object, try to get the date field
    let dateString = dateInput;
    if (typeof dateInput === 'object' && dateInput !== null && !(dateInput instanceof Date)) {
      // Try different possible date fields
      dateString = dateInput.dataDorezimit || dateInput.dita || dateInput.date || dateInput.scheduledDate;
    }
    
    const parsed = safeParseDate(dateString);
    if (!parsed) {
      console.warn('Could not parse date:', dateInput);
      return 'Data e pavlefshme';
    }
    
    try {
      return format(parsed, formatStr, options);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Data e pavlefshme';
    }
  };
  
  // Calculate days difference between two dates
  const getDaysDifference = (fromDate, toDate) => {
    const from = safeParseDate(fromDate);
    const to = safeParseDate(toDate);
    if (!from || !to) return null;
    
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
  const handleCompleteOrder = async (orderId) => {
    try {
      setCompleting(true);
      console.log('Attempting to complete order:', orderId);
      
      const result = await completeOrder(orderId, {
        completedBy: 'user', // You might want to get this from auth context
        completionNotes: 'Shënuar si e përfunduar nga kalendari'
      });
      
      // Show success message (database save is guaranteed at this point)
      showToastNotification(
        `Sukses! Porosia u shënua si e përfunduar dhe u ruajt në bazën e të dhënave.`,
        'success'
      );
      
      // Refresh orders for current modal
      if (showOrdersModal && selectedDate) {
        const parsedDate = safeParseDate(selectedDate);
        if (parsedDate) {
          const updatedOrders = getOrdersForDay(parsedDate);
          setOrdersForDate(updatedOrders);
        }
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
    } finally {
      setCompleting(false);
    }
  };
  
  // Get status badge for order
  const getStatusBadge = (order) => {
    switch (order.statusi) {
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'në proces':
      case 'borxh': // Treat debt status as "në proces" since debt info is shown in price field
        return <Badge bg="warning">Në Proces</Badge>;
      default:
        return <Badge bg="secondary">Në Proces</Badge>; // Default to "Në Proces" for any unknown status
    }
  };
  
  // Handle showing order details
  const handleShowOrderDetails = (order) => {
    setSelectedOrderForDetails(order);
    setShowOrderDetailsModal(true);
  };
  
  // Handle initiating order swap
  const handleInitiateSwap = (sourceOrder, targetDate) => {
    setSwapSourceOrder(sourceOrder);
    setSwapTargetDate(targetDate);
    
    // Debug: Log the source order to see available date fields
    console.log('Source order for swap:', sourceOrder);
    console.log('Available date fields:', {
      dita: sourceOrder.dita,
      dataDorezimit: sourceOrder.dataDorezimit,
      date: sourceOrder.date,
      scheduledDate: sourceOrder.scheduledDate,
      createdAt: sourceOrder.createdAt,
      updatedAt: sourceOrder.updatedAt
    });
    
    // Get the source order's date
    const sourceOrderDate = safeParseDate(sourceOrder.dita);
    if (!sourceOrderDate) {
      console.error('Could not parse source order date:', sourceOrder.dita);
      showToastNotification('Gabim: Data e porosisë nuk është e vlefshme', 'danger');
      return;
    }
    
    // Get ALL orders from ALL dates that could potentially be swapped
    // Filter out completed orders, the source order itself, and orders from past/same dates
    const allCompatibleOrders = orders.filter(order => {
      // Basic filters
      if (order.id === sourceOrder.id) return false; // Don't include the source order
      if (order.statusi === 'e përfunduar') return false; // Can't swap completed orders
      
      // Date filter - only show orders from future dates
      const orderDate = safeParseDate(order.dita);
      if (!orderDate) return false; // Skip orders with invalid dates
      
      // Only include orders scheduled for dates AFTER the source order's date
      return orderDate > sourceOrderDate;
    });
    
    // Debug: Log filtering results
    console.log('Source order date:', sourceOrderDate);
    console.log('Total orders:', orders.length);
    console.log('Compatible orders (future dates only):', allCompatibleOrders.length);
    
    // Debug: Log a sample order to see date fields
    if (allCompatibleOrders.length > 0) {
      console.log('Sample compatible order:', allCompatibleOrders[0]);
      console.log('Sample order date fields:', {
        dita: allCompatibleOrders[0].dita,
        dataDorezimit: allCompatibleOrders[0].dataDorezimit,
        date: allCompatibleOrders[0].date,
        scheduledDate: allCompatibleOrders[0].scheduledDate
      });
    }
    
    setAvailableOrdersForSwap(allCompatibleOrders);
    setShowSwapModal(true);
  };
  
  // Execute order swap
  const executeOrderSwap = async (targetOrder) => {
    if (!swapSourceOrder || !targetOrder) return;
    
    try {
      setSwapping(true);
      
      const sourceDate = swapSourceOrder.dita;
      const targetDate = targetOrder.dita;
      
      console.log('Swapping orders:', {
        sourceOrder: swapSourceOrder.id,
        targetOrder: targetOrder.id,
        sourceDate,
        targetDate
      });
      
      // Update both orders simultaneously
      await Promise.all([
        updateOrder(swapSourceOrder.id, { ...swapSourceOrder, dita: targetDate }),
        updateOrder(targetOrder.id, { ...targetOrder, dita: sourceDate })
      ]);
      
      // Close modal and refresh
      setShowSwapModal(false);
      setSwapSourceOrder(null);
      setSwapTargetDate('');
      setAvailableOrdersForSwap([]);
      setSwapSearchTerm('');
      
      // Refresh orders
      fetchOrders();
      
      // Update current modal if open
      if (showOrdersModal && selectedDate) {
        const updatedOrders = getOrdersForDay(parseISO(selectedDate));
        setOrdersForDate(updatedOrders);
      }
      
      showToastNotification(
        `Sukses! Porositë u shkëmbyen:
        • ${swapSourceOrder.emriKlientit} ${swapSourceOrder.mbiemriKlientit}: ${safeFormatDate(swapSourceOrder.dita)} → ${safeFormatDate(targetDate)}
        • ${targetOrder.emriKlientit} ${targetOrder.mbiemriKlientit}: ${safeFormatDate(targetDate)} → ${safeFormatDate(swapSourceOrder.dita)}`,
        'success'
      );
      
    } catch (error) {
      console.error('Error swapping orders:', error);
      showToastNotification(
        `Gabim gjatë shkëmbimit të porosive: ${error.message}`,
        'danger'
      );
    } finally {
      setSwapping(false);
    }
  };
  
  // Check if a day is at full capacity
  const isDayAtFullCapacity = (day) => {
    const capacity = getCapacity(day);
    const dayOrders = getOrdersForDay(day);
    
    if (!capacity) return false;
    
    // Count orders by type
    const doorOrders = dayOrders.filter(order => 
      order.tipiPorosise === 'derë garazhi' || order.tipiPorosise === 'derë garazhi + kapak'
    ).length;
    
    const capOrders = dayOrders.filter(order => 
      order.tipiPorosise === 'kapak' || order.tipiPorosise === 'derë garazhi + kapak'
    ).length;
    
    return (capacity.dyerGarazhi <= doorOrders) && (capacity.kapake <= capOrders);
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
            Porositë për {selectedDate ? safeFormatDate(selectedDate) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {/* Capacity Information */}
          {selectedDate && (() => {
            const parsedDate = safeParseDate(selectedDate);
            if (!parsedDate) return null;
            
            const capacity = getCapacity(parsedDate);
            const dayOrders = getOrdersForDay(parsedDate);
            const isFullCapacity = isDayAtFullCapacity(parsedDate);
            
            // Count orders by type
            const doorOrders = dayOrders.filter(order => 
              order.tipiPorosise === 'derë garazhi' || order.tipiPorosise === 'derë garazhi + kapak'
            ).length;
            
            const capOrders = dayOrders.filter(order => 
              order.tipiPorosise === 'kapak' || order.tipiPorosise === 'derë garazhi + kapak'
            ).length;
            
            return (
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <InfoCircle className="me-2" />
                    Kapaciteti i Ditës
                    {isFullCapacity && (
                      <Badge bg="danger" className="ms-2">
                        Kapacitet i plotë
                      </Badge>
                    )}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {capacity ? (
                    <div className="capacity-status">
                      <Row className="mb-3">
                        <Col md={6}>
                          <div className="d-flex align-items-center mb-2">
                            <DoorOpen className="me-2 text-primary" />
                            <strong>Dyer Garazhi:</strong>
                            <span className="ms-2">{doorOrders}/{capacity.dyerGarazhi}</span>
                          </div>
                          <ProgressBar 
                            now={(doorOrders / capacity.dyerGarazhi) * 100} 
                            variant={doorOrders >= capacity.dyerGarazhi ? "danger" : "success"}
                            className="mb-2"
                          />
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center mb-2">
                            <Tools className="me-2 text-info" />
                            <strong>Kapgjik:</strong>
                            <span className="ms-2">{capOrders}/{capacity.kapake}</span>
                          </div>
                          <ProgressBar 
                            now={(capOrders / capacity.kapake) * 100} 
                            variant={capOrders >= capacity.kapake ? "danger" : "success"}
                            className="mb-2"
                          />
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="warning" className="mb-0">
                      <InfoCircle className="me-2" />
                      Nuk ka kapacitet të përcaktuar për këtë ditë
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            );
          })()}
          
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
                        {/* Emergency Swap Button - only show if day is at full capacity */}
                        {order.statusi !== 'e përfunduar' && isDayAtFullCapacity(parseISO(selectedDate)) && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleInitiateSwap(order, selectedDate)}
                            className="me-2"
                            title="Shkëmbe me porosi tjetër për emergjencë"
                          >
                            <ArrowRepeat className="me-1" size={14} />
                            Shkëmbe
                          </Button>
                        )}
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShowOrderDetails(order)}
                          className="me-2"
                        >
                          <InfoCircle className="me-1" size={14} />
                          Detaje
                        </Button>
                        
                        {/* Always show Swap button */}
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleInitiateSwap(order, selectedDate)}
                          className="me-2"
                        >
                          <ArrowRepeat className="me-1" size={14} />
                          Shkëmbe
                        </Button>
                        
                        {order.statusi !== 'e përfunduar' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={completing}
                          >
                            {completing ? (
                              <Spinner animation="border" size="sm" className="me-1" />
                            ) : (
                              <CheckCircleFill className="me-1" size={14} />
                            )}
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
              <Button 
                variant="primary" 
                onClick={() => navigate('/orders/new', { state: { selectedDate } })}
                className="mt-2"
              >
                <CalendarEvent className="me-2" />
                Shto Porosi të Re
              </Button>
                    </div>
                  )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/orders/new', { state: { selectedDate } })}
          >
            <CalendarEvent className="me-2" />
            Porosi e Re
          </Button>
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
                <small>Data origjinale: {safeFormatDate(orderToReschedule.dita)}</small>
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
                          {safeFormatDate(date, 'dd/MM/yyyy EEEE')}
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

      {/* Order Details Modal */}
      <Modal show={showOrderDetailsModal} onHide={() => setShowOrderDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <InfoCircle className="me-2 text-info" />
            Detajet e Porosisë #{selectedOrderForDetails?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {selectedOrderForDetails && (
            <div>
              {/* Customer Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <Person className="me-2" />
                    Informacionet e Klientit
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <Person size={14} className="me-2 text-muted" />
                        <strong>Emri:</strong> {selectedOrderForDetails.emriKlientit} {selectedOrderForDetails.mbiemriKlientit}
                      </div>
                      <div className="detail-item mb-2">
                        <Phone size={14} className="me-2 text-muted" />
                        <strong>Telefoni:</strong> {selectedOrderForDetails.numriTelefonit}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <GeoAlt size={14} className="me-2 text-muted" />
                        <strong>Vendi:</strong> {selectedOrderForDetails.vendi}
                      </div>
                      <div className="detail-item mb-2">
                        <Badge bg={selectedOrderForDetails.statusi === 'e përfunduar' ? 'success' : 'warning'}>
                          {selectedOrderForDetails.statusi === 'e përfunduar' ? 'E Përfunduar' : 'Në Proces'}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Order Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <DoorOpen className="me-2" />
                    Detajet e Porosisë
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <CalendarEvent size={14} className="me-2 text-muted" />
                        <strong>Data e Dorëzimit:</strong> {safeFormatDate(selectedOrderForDetails.dita, 'dd/MM/yyyy EEEE')}
                      </div>
                      <div className="detail-item mb-2">
                        <DoorOpen size={14} className="me-2 text-muted" />
                        <strong>Tipi i Porosisë:</strong> {selectedOrderForDetails.tipiPorosise}
                      </div>
                      <div className="detail-item mb-2">
                        <Person size={14} className="me-2 text-muted" />
                        <strong>Shitësi:</strong> {selectedOrderForDetails.shitesi}
                      </div>
                    </Col>
                    <Col md={6}>
                      {selectedOrderForDetails.matesi && (
                        <div className="detail-item mb-2">
                          <Person size={14} className="me-2 text-muted" />
                          <strong>Matësi:</strong> {selectedOrderForDetails.matesi}
                        </div>
                      )}
                      {selectedOrderForDetails.dataMatjes && (
                        <div className="detail-item mb-2">
                          <CalendarEvent size={14} className="me-2 text-muted" />
                          <strong>Data e Matjes:</strong> {safeFormatDate(selectedOrderForDetails.dataMatjes)}
                        </div>
                      )}
                      {selectedOrderForDetails.statusiMatjes && (
                        <div className="detail-item mb-2">
                          <Badge bg={selectedOrderForDetails.statusiMatjes === 'e matur' ? 'success' : 'warning'}>
                            {selectedOrderForDetails.statusiMatjes === 'e matur' ? 'E Matur' : 'E Pamatur'}
                          </Badge>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Financial Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <CurrencyEuro className="me-2" />
                    Informacionet Financiare
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <CurrencyEuro size={14} className="me-2 text-muted" />
                        <strong>Çmimi Total:</strong> {selectedOrderForDetails.cmimiTotal}€
                      </div>
                      <div className="detail-item mb-2">
                        <CurrencyEuro size={14} className="me-2 text-muted" />
                        <strong>Kaparja:</strong> {selectedOrderForDetails.kaparja}€
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <CurrencyEuro size={14} className="me-2 text-muted" />
                        <strong>Pagesa e Mbetur:</strong> {(parseFloat(selectedOrderForDetails.cmimiTotal || 0) - parseFloat(selectedOrderForDetails.kaparja || 0)).toFixed(2)}€
                      </div>
                      <div className="detail-item mb-2">
                        <Badge bg={selectedOrderForDetails.isPaymentDone ? 'success' : 'warning'}>
                          {selectedOrderForDetails.isPaymentDone ? 'E Paguar' : 'E Papaguar'}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Dimensions (if available) */}
              {(selectedOrderForDetails.gjatesia || selectedOrderForDetails.gjeresia) && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <Tools className="me-2" />
                      Dimensionet
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        {selectedOrderForDetails.gjatesia && (
                          <div className="detail-item mb-2">
                            <strong>Gjatësia:</strong> {selectedOrderForDetails.gjatesia} cm
                          </div>
                        )}
                        {selectedOrderForDetails.gjeresia && (
                          <div className="detail-item mb-2">
                            <strong>Gjerësia:</strong> {selectedOrderForDetails.gjeresia} cm
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        {selectedOrderForDetails.profiliLarte && (
                          <div className="detail-item mb-2">
                            <strong>Profili i Lartë:</strong> {selectedOrderForDetails.profiliLarte} cm
                          </div>
                        )}
                        {selectedOrderForDetails.profiliPoshtem && (
                          <div className="detail-item mb-2">
                            <strong>Profili i Poshtëm:</strong> {selectedOrderForDetails.profiliPoshtem} cm
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Additional Information */}
              {(selectedOrderForDetails.sender || selectedOrderForDetails.installer || selectedOrderForDetails.pershkrimi) && (
                <Card>
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <InfoCircle className="me-2" />
                      Informacione Shtesë
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {selectedOrderForDetails.sender && (
                      <div className="detail-item mb-2">
                        <Person size={14} className="me-2 text-muted" />
                        <strong>Dërguesi:</strong> {selectedOrderForDetails.sender}
                      </div>
                    )}
                    {selectedOrderForDetails.installer && (
                      <div className="detail-item mb-2">
                        <Tools size={14} className="me-2 text-muted" />
                        <strong>Instaluesi:</strong> {selectedOrderForDetails.installer}
                      </div>
                    )}
                    {selectedOrderForDetails.pershkrimi && (
                      <div className="detail-item mb-2">
                        <FileText size={14} className="me-2 text-muted" />
                        <strong>Përshkrimi:</strong> {selectedOrderForDetails.pershkrimi}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button variant="outline-secondary" onClick={() => setShowOrderDetailsModal(false)}>
            Mbyll
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Swap Modal */}
      <Modal show={showSwapModal} onHide={() => {
        setShowSwapModal(false);
        setSwapSearchTerm('');
      }} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <ArrowRepeat className="me-2 text-warning" />
            Shkëmbim Porosish
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {swapSourceOrder && (
            <div>
              <Alert variant="info">
                <InfoCircle className="me-2" />
                <strong>Porosi për shkëmbim:</strong> {swapSourceOrder.emriKlientit} {swapSourceOrder.mbiemriKlientit}
                <br />
                <small>
                  Data aktuale: {safeFormatDate(swapSourceOrder.dita)}
                  <br />
                  Tipi: {swapSourceOrder.tipiPorosise}
                </small>
              </Alert>
              
              <h6>
                <ExclamationTriangleFill className="me-2 text-warning" />
                Zgjidhni një porosi për shkëmbim nga datat e ardhshme:
                {availableOrdersForSwap.length > 0 && (
                  <Badge bg="secondary" className="ms-2">
                    {availableOrdersForSwap.length} porosi të disponueshme
                  </Badge>
                )}
              </h6>
              
              {availableOrdersForSwap.length > 0 && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Kërkoni sipas emrit, telefonit ose vendndodhjes..."
                    value={swapSearchTerm}
                    onChange={(e) => setSwapSearchTerm(e.target.value)}
                  />
                </div>
              )}
              
              {availableOrdersForSwap.length > 0 && (
                <Alert variant="info" className="mb-3">
                  <InfoCircle className="me-2" />
                  <small>
                    Shfaqen të gjitha porositë e planifikuara për datat pas {safeFormatDate(swapSourceOrder?.dita)} 
                    (pavarësisht nga tipi i porosisë) për të shmangur konfliktet e planifikimit. Porositë janë renditur sipas datës (më të afërtat së pari).
                  </small>
                </Alert>
              )}
              
              {availableOrdersForSwap.length > 0 ? (
                <div className="swap-orders-list">
                  {availableOrdersForSwap
                    .filter(order => {
                      if (!swapSearchTerm) return true;
                      const searchLower = swapSearchTerm.toLowerCase();
                      return (
                        order.emriKlientit?.toLowerCase().includes(searchLower) ||
                        order.mbiemriKlientit?.toLowerCase().includes(searchLower) ||
                        order.numriTelefonit?.includes(swapSearchTerm) ||
                        order.vendi?.toLowerCase().includes(searchLower)
                      );
                    })
                    .sort((a, b) => {
                      // Sort by date - nearest future dates first
                      const dateA = safeParseDate(a.dita);
                      const dateB = safeParseDate(b.dita);
                      if (!dateA || !dateB) return 0;
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(order => (
                      <Card key={order.id} className="mb-2 swap-order-card">
                        <Card.Body className="py-2">
                          <Row className="align-items-center">
                            <Col md={7}>
                              <div className="d-flex align-items-center">
                                <Person className="me-2" size={16} />
                                <div>
                                  <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <Phone size={12} className="me-1" />
                                    {order.numriTelefonit} | 
                                    <GeoAlt size={12} className="me-1 ms-2" />
                                    {order.vendi}
                                  </small>
                                  <br />
                                  <small className="text-info">
                                    <DoorOpen size={12} className="me-1" />
                                    {order.tipiPorosise}
                                  </small>
                                </div>
                              </div>
                            </Col>
                            <Col md={3}>
                              <div className="text-center">
                                <Badge bg="info" className="mb-1">
                                  <CalendarEvent size={12} className="me-1" />
                                  Data Aktuale
                                </Badge>
                                <div className="small">
                                  {(() => {
                                    // Try different date fields and show which one works
                                    const dateFields = [
                                      { field: 'dita', value: order.dita },
                                      { field: 'dataDorezimit', value: order.dataDorezimit },
                                      { field: 'date', value: order.date },
                                      { field: 'scheduledDate', value: order.scheduledDate }
                                    ];
                                    
                                    for (const { field, value } of dateFields) {
                                      if (value) {
                                        const formatted = safeFormatDate(value);
                                        if (formatted !== 'Data e pavlefshme') {
                                          const daysDiff = getDaysDifference(swapSourceOrder?.dita, value);
                                          return (
                                            <div>
                                              <div>{formatted}</div>
                                              <small className="text-muted">
                                                ({field})
                                                {daysDiff && (
                                                  <span className="text-success ms-1">
                                                    +{daysDiff} ditë
                                                  </span>
                                                )}
                                              </small>
                                            </div>
                                          );
                                        }
                                      }
                                    }
                                    
                                    // If no valid date found, show debug info
                                    return (
                                      <div>
                                        <div className="text-danger">Data e pavlefshme</div>
                                        <small className="text-muted">
                                          Debug: {JSON.stringify({
                                            dita: order.dita,
                                            dataDorezimit: order.dataDorezimit,
                                            date: order.date
                                          })}
                                        </small>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </Col>
                            <Col md={2} className="text-end">
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => executeOrderSwap(order)}
                                disabled={swapping}
                                className="swap-btn"
                              >
                                {swapping ? (
                                  <Spinner animation="border" size="sm" className="me-1" />
                                ) : (
                                  <ArrowRepeat className="me-1" size={14} />
                                )}
                                Shkëmbe
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                </div>
              ) : (
                <Alert variant="warning">
                  <ExclamationTriangleFill className="me-2" />
                  Nuk ka porosi të përshtatshme për shkëmbim nga datat e ardhshme.
                  <br />
                  <small>
                    Porositë duhet të jenë:
                    <ul className="mb-0 mt-1">
                      <li>Jo të përfunduara</li>
                      <li>Të planifikuara për datat pas {safeFormatDate(swapSourceOrder?.dita)}</li>
                    </ul>
                  </small>
                </Alert>
              )}
              
              <Alert variant="info" className="mt-3">
                <InfoCircle className="me-2" />
                <strong>Si funksionon:</strong> Kur shkëmbeni porositë, ato do të ndërrojnë datat e dorëzimit me njëra-tjetrën.
                <br />
                <small>
                  <strong>Porosi juaj:</strong> {swapSourceOrder.emriKlientit} {swapSourceOrder.mbiemriKlientit} 
                  (aktualisht: {safeFormatDate(swapSourceOrder.dita)})
                  <br />
                  <strong>Do të shkojë në:</strong> Datën e porosisë që zgjidhni për shkëmbim
                </small>
              </Alert>
              
              <Alert variant="warning" className="mt-2">
                <ExclamationTriangleFill className="me-2" />
                <strong>Kujdes:</strong> Ky veprim do të shkëmbejë datat e dorëzimit të dy porosive. 
                Sigurohuni që të kontaktoni të dy klientët për të konfirmuar ndryshimin e datave.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowSwapModal(false);
              setSwapSearchTerm('');
            }}
            disabled={swapping}
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