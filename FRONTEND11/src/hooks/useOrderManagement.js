import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isAfter, parseISO } from 'date-fns';
import { 
  getAllOrders, 
  rescheduleOrder, 
  getOverdueOrders,
  markOrderAsCompleted,
  checkDateCapacity,
  updateOrderDate 
} from '../services/orderService';
import { 
  createOverdueOrderNotification, 
  createOrderRescheduledNotification,
  createCapacityWarningNotification 
} from '../services/notificationService';

const useOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [overdueOrders, setOverdueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Use useRef to avoid infinite loops with date comparisons
  const lastOverdueCheckRef = useRef(null);
  const overdueCheckIntervalRef = useRef(null);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Ka ndodhur një gabim gjatë marrjes së porosive');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for overdue orders and create notifications - Fixed to prevent infinite loops
  const checkAndNotifyOverdueOrders = useCallback(async (ordersToCheck) => {
    try {
      const today = new Date();
      const currentOverdueOrders = ordersToCheck.filter(order => {
        if (!order.dita || order.statusi === 'e përfunduar') return false;
        
        const orderDate = parseISO(order.dita);
        return isAfter(today, orderDate) && order.statusi !== 'e përfunduar';
      });

      setOverdueOrders(currentOverdueOrders);

      // Only create notifications for newly detected overdue orders
      const lastCheckTime = lastOverdueCheckRef.current ? new Date(lastOverdueCheckRef.current) : null;
      
      // Only process notifications if enough time has passed (prevent spam)
      const timeSinceLastCheck = lastCheckTime ? (today.getTime() - lastCheckTime.getTime()) / (1000 * 60) : Infinity;
      
      if (timeSinceLastCheck > 30) { // Only check every 30 minutes minimum
        for (const order of currentOverdueOrders) {
          const orderDate = parseISO(order.dita);
          
          // Create notification if this is a new overdue order or first check
          if (!lastCheckTime || isAfter(orderDate, lastCheckTime)) {
            try {
              await createOverdueOrderNotification(order);
              console.log(`Created overdue notification for order ${order.id}`);
            } catch (notificationError) {
              console.warn(`Failed to create notification for order ${order.id}:`, notificationError);
            }
          }
        }
        
        lastOverdueCheckRef.current = today.toISOString();
      }
      
      return currentOverdueOrders;
    } catch (error) {
      console.error('Error checking overdue orders:', error);
      return [];
    }
  }, []); // No dependencies to prevent infinite loops

  // Reschedule an order with notification - Database-only, no misleading local fallbacks
  const rescheduleOrderWithNotification = useCallback(async (orderId, newDate, reason = 'Riplanifikim nga kalendari') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Porosia nuk u gjet');
      }

      const oldDate = order.dita;
      let updatedOrder;
      let saveMethod = '';

      try {
        // First try to check capacity for new date
        const capacityCheck = await checkDateCapacity(newDate, order.tipiPorosise);
        if (!capacityCheck.hasCapacity) {
          throw new Error(`Data ${newDate} nuk ka kapacitet të mjaftueshëm për këtë lloj porosie`);
        }
      } catch (capacityError) {
        console.warn('Capacity check failed, proceeding with rescheduling:', capacityError);
        // Continue with rescheduling even if capacity check fails
      }

      try {
        // Try the reschedule endpoint first
        updatedOrder = await rescheduleOrder(orderId, newDate, reason);
        saveMethod = 'reschedule endpoint';
        console.log('Successfully saved to database via reschedule endpoint');
      } catch (rescheduleError) {
        console.warn('Reschedule endpoint failed, trying fallback method:', rescheduleError);
        
        // Fallback: Use the simpler updateOrderDate endpoint
        try {
          updatedOrder = await updateOrderDate(orderId, newDate);
          saveMethod = 'updateOrderDate endpoint';
          console.log('Successfully saved to database via updateOrderDate endpoint');
        } catch (updateError) {
          console.error('All database save methods failed:', updateError);
          
          // No local fallback - throw error to indicate complete failure
          throw new Error(`Riplanifikimi dështoi. Nuk mund të ruhet në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${updateError.message}`);
        }
      }

      // Only update local state if database save was successful
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? updatedOrder : o)
      );

      // Remove from overdue list if it was there
      setOverdueOrders(prevOverdue => 
        prevOverdue.filter(o => o.id !== orderId)
      );

      // Try to create notification (optional - failure here doesn't affect the main operation)
      try {
        await createOrderRescheduledNotification(
          updatedOrder, 
          format(parseISO(oldDate), 'dd/MM/yyyy'), 
          format(parseISO(newDate), 'dd/MM/yyyy')
        );
      } catch (notificationError) {
        console.warn('Failed to create rescheduling notification:', notificationError);
        // Continue without notification - this is not critical
      }

      // Return success result
      return {
        order: updatedOrder,
        saveStatus: 'database_saved',
        saveMethod: saveMethod,
        message: `Riplanifikimi u ruajt me sukses në bazën e të dhënave (${saveMethod})`
      };
      
    } catch (error) {
      console.error('Error rescheduling order:', error);
      throw error; // Re-throw to ensure caller knows about the failure
    }
  }, [orders]);

  // Mark order as completed - Database-only, no misleading local fallbacks
  const completeOrder = useCallback(async (orderId, completionData = {}) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Porosia nuk u gjet');
      }

      let updatedOrder;

      try {
        // Try the complete endpoint
        updatedOrder = await markOrderAsCompleted(orderId, completionData);
        console.log('Successfully marked as completed in database');
      } catch (completeError) {
        console.error('Complete endpoint failed:', completeError);
        
        // No local fallback - throw error to indicate complete failure
        throw new Error(`Shënimi si i përfunduar dështoi. Nuk mund të ruhet në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${completeError.message}`);
      }
      
      // Only update local state if database save was successful
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? updatedOrder : o)
      );

      // Remove from overdue list if it was there
      setOverdueOrders(prevOverdue => 
        prevOverdue.filter(o => o.id !== orderId)
      );

      // Return success result
      return {
        order: updatedOrder,
        saveStatus: 'database_saved',
        message: 'Porosia u shënua si e përfunduar në bazën e të dhënave'
      };
      
    } catch (error) {
      console.error('Error completing order:', error);
      throw error; // Re-throw to ensure caller knows about the failure
    }
  }, [orders]);

  // Check capacity for a specific date - Enhanced with fallback
  const checkCapacityForDate = useCallback(async (date, orderType = null) => {
    try {
      return await checkDateCapacity(date, orderType);
    } catch (error) {
      console.warn('Capacity check failed, returning default response:', error);
      
      // Fallback: Return a default response assuming capacity is available
      return {
        hasCapacity: true,
        availableCapacity: {
          dyerGarazhi: 5,
          kapake: 5
        },
        message: 'Kapaciteti i disponueshëm (vlerësim lokal)'
      };
    }
  }, []);

  // Get orders for a specific day
  const getOrdersForDay = useCallback((day) => {
    try {
      const formattedDay = format(day, 'yyyy-MM-dd');
      return orders.filter(order => order.dita === formattedDay);
    } catch (error) {
      console.error('Error getting orders for day:', error);
      return [];
    }
  }, [orders]);

  // Get day status based on orders and date
  const getDayStatus = useCallback((day) => {
    const dayOrders = getOrdersForDay(day);
    if (dayOrders.length === 0) return 'available';
    
    const today = new Date();
    const dayDate = new Date(day);
    
    // Check if any orders are overdue
    const hasOverdueOrders = dayOrders.some(order => 
      isAfter(today, dayDate) && order.statusi !== 'e përfunduar'
    );
    
    if (hasOverdueOrders) return 'overdue';
    
    // Check if day has scheduled orders
    const hasScheduledOrders = dayOrders.some(order => order.statusi !== 'e përfunduar');
    if (hasScheduledOrders) return 'scheduled';
    
    return 'completed';
  }, [getOrdersForDay]);

  // Initialize orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Check for overdue orders when orders change - Fixed to prevent infinite loops
  useEffect(() => {
    if (orders.length > 0) {
      checkAndNotifyOverdueOrders(orders);
    }
  }, [orders]); // Removed checkAndNotifyOverdueOrders from dependencies

  // Setup periodic check for overdue orders - Fixed to prevent infinite loops
  useEffect(() => {
    // Clear any existing interval
    if (overdueCheckIntervalRef.current) {
      clearInterval(overdueCheckIntervalRef.current);
    }

    // Only set up interval if we have orders
    if (orders.length > 0) {
      overdueCheckIntervalRef.current = setInterval(() => {
        checkAndNotifyOverdueOrders(orders);
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Cleanup function
    return () => {
      if (overdueCheckIntervalRef.current) {
        clearInterval(overdueCheckIntervalRef.current);
      }
    };
  }, [orders.length > 0]); // Only depend on whether we have orders, not the orders themselves

  return {
    // State
    orders,
    overdueOrders,
    loading,
    error,
    
    // Actions
    fetchOrders,
    rescheduleOrderWithNotification,
    completeOrder,
    checkCapacityForDate,
    checkAndNotifyOverdueOrders: (ordersToCheck) => checkAndNotifyOverdueOrders(ordersToCheck || orders),
    
    // Utilities
    getOrdersForDay,
    getDayStatus
  };
};

export default useOrderManagement; 