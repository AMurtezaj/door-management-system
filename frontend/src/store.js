import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Create store with persistence
const useStore = create(
  persist(
    (set, get) => ({
      // Order state
      orders: [],
      currentOrder: null,
      orderStats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        debt: 0
      },
      
      // Capacity state
      dailyCapacities: [],
      
      // Payment and debt state
      debts: [],
      payments: [],
      
      // UI state
      notifications: [],
      hasNewNotifications: false,
      
      // Order actions
      setOrders: (orders) => set({ orders }),
      setCurrentOrder: (order) => set({ currentOrder: order }),
      setOrderStats: (stats) => set({ orderStats: stats }),
      
      // Capacity actions
      setDailyCapacities: (capacities) => set({ dailyCapacities: capacities }),
      
      // Payment and debt actions
      setDebts: (debts) => set({ debts }),
      setPayments: (payments) => set({ payments }),
      
      // Notification actions
      addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        hasNewNotifications: true
      })),
      markNotificationsAsRead: () => set({ hasNewNotifications: false }),
      clearNotifications: () => set({ notifications: [] }),
      
      // Clear all state (used on logout)
      clearState: () => set({
        orders: [],
        currentOrder: null,
        orderStats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          debt: 0
        },
        dailyCapacities: [],
        debts: [],
        payments: [],
        notifications: [],
        hasNewNotifications: false
      })
    }),
    {
      name: 'door-system-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        hasNewNotifications: state.hasNewNotifications
      })
    }
  )
);

export default useStore; 