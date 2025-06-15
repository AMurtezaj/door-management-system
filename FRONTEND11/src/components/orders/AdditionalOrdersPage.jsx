import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner, Modal, Card } from 'react-bootstrap';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { sq } from 'date-fns/locale';
import { Calendar3, ArrowRepeat, InfoCircle } from 'react-bootstrap-icons';
import { 
  getSupplementaryOrdersByParentId, 
  updateSupplementaryOrderPaymentStatus, 
  deleteSupplementaryOrder,
  markSupplementaryOrderAsPrinted,
  addPartialPaymentToSupplementaryOrder
} from '../../services/supplementaryOrderService';
import { getAllOrders } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { generateQRData, generateQRUrl, generateFallbackQRData } from '../../utils/qrDataGenerator';
import SupplementaryOrderEditForm from './SupplementaryOrderEditForm';
import PartialPaymentModal from '../payments/PartialPaymentModal';

const AdditionalOrdersPage = () => {
  const { canManagePayments, canEditOrders, canDeleteOrders, isManager, user, isAuthenticated } = useAuth();
  const [supplementaryOrders, setSupplementaryOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [parentOrders, setParentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, inProcess, completed, debt, unpaid
  const [searchTerm, setSearchTerm] = useState('');
  
  // Time filtering state
  const [timeFilter, setTimeFilter] = useState('currentWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Edit order state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  
  // Partial payment modal state
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  
  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Apply filtering and sorting when data changes
  useEffect(() => {
    filterAndSortOrders();
  }, [supplementaryOrders, filter, searchTerm, timeFilter, customStartDate, customEndDate, sortOrder]);
  
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all main orders to find garage door orders
      const allOrders = await getAllOrders();
      const garageDoorOrders = allOrders.filter(order => 
        order.tipiPorosise === 'derë garazhi' || order.tipiPorosise === 'derë garazhi + kapak'
      );
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

  const filterAndSortOrders = () => {
    let filtered = [...supplementaryOrders];
    const today = new Date();
    
    // Apply time filter first (based on parent order delivery date)
    switch (timeFilter) {
      case 'currentWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: weekStart, end: weekEnd });
        });
        break;
        
      case 'currentMonth':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
        });
        break;
        
      case 'nextWeek':
        const nextWeekStart = startOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: nextWeekStart, end: nextWeekEnd });
        });
        break;
        
      case 'nextMonth':
        const nextMonthStart = startOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        const nextMonthEnd = endOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: nextMonthStart, end: nextMonthEnd });
        });
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = parseISO(customStartDate);
          const end = parseISO(customEndDate);
          filtered = filtered.filter(order => {
            if (!order.parentOrderInfo?.dita) return false;
            const orderDate = parseISO(order.parentOrderInfo.dita);
            return isWithinInterval(orderDate, { start, end });
          });
        }
        break;
        
      case 'all':
      default:
        // No time filtering
        break;
    }
    
    // Apply status filter
    if (filter === 'inProcess') {
      filtered = filtered.filter(order => order.statusi === 'në proces');
    } else if (filter === 'completed') {
      filtered = filtered.filter(order => order.statusi === 'e përfunduar');
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

    // Apply sorting by parent order delivery date
    const sorted = filtered.sort((a, b) => {
      const dateA = a.parentOrderInfo?.dita ? new Date(a.parentOrderInfo.dita) : new Date(0);
      const dateB = b.parentOrderInfo?.dita ? new Date(b.parentOrderInfo.dita) : new Date(0);
      
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });
    
    setFilteredOrders(sorted);
  };

  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (newFilter !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const getFilterDescription = () => {
    const today = new Date();
    
    switch (timeFilter) {
      case 'currentWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return `Java aktuale (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`;
        
      case 'currentMonth':
        return `Muaji aktual (${format(today, 'MMMM yyyy', { locale: sq })})`;
        
      case 'nextWeek':
        const nextWeekStart = startOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        return `Java e ardhshme (${format(nextWeekStart, 'dd/MM')} - ${format(nextWeekEnd, 'dd/MM')})`;
        
      case 'nextMonth':
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return `Muaji i ardhshëm (${format(nextMonth, 'MMMM yyyy', { locale: sq })})`;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          return `Interval i zgjedhur (${format(parseISO(customStartDate), 'dd/MM/yyyy')} - ${format(parseISO(customEndDate), 'dd/MM/yyyy')})`;
        }
        return 'Interval i personalizuar';
        
      case 'all':
      default:
        return 'Të gjitha porositë shtesë';
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
            isPaymentDone: isPaid
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
  
  const handleEdit = (order) => {
    setSelectedOrderForEdit(order);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedOrder) => {
    // Update the order in the list
    setSupplementaryOrders(orders => 
      orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    
    // Show success message
    setError('');
    alert('Porosia shtesë u përditësua me sukses!');
  };
  
  const handlePrintInvoice = async (supplementaryOrder) => {
    try {
      const parentOrder = supplementaryOrder.parentOrderInfo;
      
      // Helper function to safely format dates
      const safeFormatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
          console.error('Date formatting error:', error);
          return 'N/A';
        }
      };

      // Helper function to format status - never show "borxh"
      const formatStatusForInvoice = (status) => {
        switch (status) {
          case 'në proces':
          case 'borxh': // Treat debt status as "në proces" since debt info is shown in price section
            return 'Në Proces';
          case 'e përfunduar':
            return 'E Përfunduar';
          default:
            return 'Në Proces'; // Default to "Në Proces" for any unknown status
        }
      };

      // Generate comprehensive QR data using the utility
      const qrData = generateQRData(supplementaryOrder, user, 'SUPPLEMENTARY_INVOICE', parentOrder);
      
      // Configuration for QR URLs
      const QR_CONFIG = {
        development: {
          host: '192.168.0.104',
          port: '5173',
          protocol: 'http'
        }
      };
      
      // Generate QR URL
      const qrUrl = generateQRUrl(qrData, QR_CONFIG);

      // Create the HTML content for the invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Faturë Shtesë #${supplementaryOrder.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #007bff;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 5px;
            }
            
            .company-tagline {
              font-size: 14px;
              color: #666;
              font-style: italic;
            }
            
            .invoice-details {
              text-align: right;
              flex: 1;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            
            .invoice-number {
              font-size: 16px;
              color: #007bff;
              font-weight: bold;
            }
            
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              gap: 40px;
            }
            
            .info-block {
              flex: 1;
              padding: 15px;
              background: #f8f9fa;
              border-left: 4px solid #007bff;
            }
            
            .info-block h3 {
              font-size: 14px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-block p {
              margin-bottom: 5px;
              font-size: 13px;
            }
            
            .info-block strong {
              color: #333;
            }
            
            .parent-order-link {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              border-radius: 5px;
              padding: 10px;
              margin: 20px 0;
              text-align: center;
            }
            
            .parent-order-link h4 {
              color: #1976d2;
              margin-bottom: 5px;
              font-size: 14px;
            }
            
            .products-section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 2px solid #007bff;
            }
            
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            
            .products-table th {
              background: #007bff;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .products-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
              vertical-align: top;
            }
            
            .products-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            .products-table tr:hover {
              background: #e3f2fd;
            }
            
            .financial-summary {
              display: flex;
              justify-content: space-between;
              gap: 30px;
              margin-bottom: 30px;
            }
            
            .payment-info,
            .totals {
              flex: 1;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            
            .payment-info {
              background: #f0f8f0;
            }
            
            .totals {
              background: #f8f8ff;
            }
            
            .payment-info h4,
            .totals h4 {
              color: #333;
              margin-bottom: 10px;
              font-size: 14px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            
            .total-row.final {
              border-bottom: none;
              border-top: 2px solid #007bff;
              font-weight: bold;
              font-size: 14px;
              color: #007bff;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .qr-section {
              text-align: center;
            }
            
            .qr-code {
              width: 80px;
              height: 80px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #666;
              margin: 0 auto 5px;
            }
            
            .footer-info {
              text-align: right;
              font-size: 11px;
              color: #666;
            }
            
            .print-actions {
              margin: 20px 0;
              text-align: center;
              gap: 10px;
            }
            
            .print-actions button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin: 0 5px;
            }
            
            .print-actions button:hover {
              background: #0056b3;
            }
            
            .print-actions button.secondary {
              background: #6c757d;
            }
            
            .print-actions button.secondary:hover {
              background: #545b62;
            }
            
            @media print {
              .print-actions {
                display: none !important;
              }
              
              .invoice-container {
                padding: 0;
                max-width: none;
              }
              
              body {
                font-size: 11px;
              }
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .status-completed {
              background: #d4edda;
              color: #155724;
            }
            
            .status-process {
              background: #fff3cd;
              color: #856404;
            }
            
            .payment-paid {
              background: #d4edda;
              color: #155724;
            }
            
            .payment-unpaid {
              background: #f8d7da;
              color: #721c24;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <div class="company-name">LindDoors</div>
                <div class="company-tagline">Dyert e Garazheve & Sisteme Sigurie</div>
              </div>
              <div class="invoice-details">
                <div class="invoice-title">FATURË SHTESË</div>
                <div class="invoice-number">#${supplementaryOrder.id}</div>
              </div>
            </div>

            <!-- Parent Order Connection -->
            <div class="parent-order-link">
              <h4>🔗 Lidhur me Porosinë Kryesore</h4>
              <p><strong>Porosia #${parentOrder?.id || 'N/A'}</strong> - ${parentOrder?.tipiPorosise || 'N/A'}</p>
              <p>Data e Dorëzimit: <strong>${safeFormatDate(parentOrder?.dita)}</strong></p>
            </div>

            <!-- Customer and Order Info -->
            <div class="info-section">
              <div class="info-block">
                <h3>Të Dhënat e Klientit</h3>
                <p><strong>Emri:</strong> ${supplementaryOrder.emriKlientit || 'N/A'} ${supplementaryOrder.mbiemriKlientit || ''}</p>
                <p><strong>Telefoni:</strong> ${supplementaryOrder.numriTelefonit || 'N/A'}</p>
                <p><strong>Vendi:</strong> ${supplementaryOrder.vendi || 'N/A'}</p>
              </div>
              
              <div class="info-block">
                <h3>Të Dhënat e Porosisë</h3>
                <p><strong>Data e Krijimit:</strong> ${safeFormatDate(supplementaryOrder.dataKrijimit)}</p>
                <p><strong>Statusi:</strong> 
                  <span class="status-badge ${supplementaryOrder.statusi === 'e përfunduar' ? 'status-completed' : 'status-process'}">
                    ${formatStatusForInvoice(supplementaryOrder.statusi)}
                  </span>
                </p>
                <p><strong>Marrësi i Kaparos:</strong> ${supplementaryOrder.kaparaReceiver || 'N/A'}</p>
              </div>
            </div>

            <!-- Products Section -->
            <div class="products-section">
              <h3 class="section-title">Detajet e Produktit</h3>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Përshkrimi i Produktit</th>
                    <th style="width: 120px;">Çmimi Total</th>
                    <th style="width: 100px;">Kaparja</th>
                    <th style="width: 120px;">Mbetet për Pagesë</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${supplementaryOrder.pershkrimiProduktit || 'N/A'}</td>
                    <td style="text-align: right; font-weight: bold;">${parseFloat(supplementaryOrder.cmimiTotal || 0).toFixed(2)} €</td>
                    <td style="text-align: right;">${parseFloat(supplementaryOrder.kaparja || 0).toFixed(2)} €</td>
                    <td style="text-align: right; font-weight: bold;">
                      ${(parseFloat(supplementaryOrder.cmimiTotal || 0) - parseFloat(supplementaryOrder.kaparja || 0)).toFixed(2)} €
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Financial Summary -->
            <div class="financial-summary">
              <div class="payment-info">
                <h4>💰 Informacioni i Pagesës</h4>
                <div class="total-row">
                  <span>Statusi i Pagesës:</span>
                  <span class="status-badge ${supplementaryOrder.isPaymentDone ? 'payment-paid' : 'payment-unpaid'}">
                    ${supplementaryOrder.isPaymentDone ? 'E Paguar' : 'E Papaguar'}
                  </span>
                </div>
                <div class="total-row">
                  <span>Kaparja e Dhënë:</span>
                  <span>${parseFloat(supplementaryOrder.kaparja || 0).toFixed(2)} €</span>
                </div>
                <div class="total-row">
                  <span>Mbetet për Pagesë:</span>
                  <span style="color: ${supplementaryOrder.isPaymentDone ? '#28a745' : '#dc3545'}; font-weight: bold;">
                    ${supplementaryOrder.isPaymentDone ? '0.00' : (parseFloat(supplementaryOrder.cmimiTotal || 0) - parseFloat(supplementaryOrder.kaparja || 0)).toFixed(2)} €
                  </span>
                </div>
              </div>
              
              <div class="totals">
                <h4>📊 Përmbledhja Financiare</h4>
                <div class="total-row">
                  <span>Çmimi i Produktit:</span>
                  <span>${parseFloat(supplementaryOrder.cmimiTotal || 0).toFixed(2)} €</span>
                </div>
                <div class="total-row">
                  <span>Taksa (përfshirë):</span>
                  <span>0.00 €</span>
                </div>
                <div class="total-row final">
                  <span>TOTALI:</span>
                  <span>${parseFloat(supplementaryOrder.cmimiTotal || 0).toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="qr-section">
                <div class="qr-code">
                  QR: ${qrData.verification.code}
                </div>
                <small>Kod Sigurie</small>
                <div style="margin-top: 10px; font-size: 10px;">
                  <strong>Verifikim:</strong><br/>
                  <code style="font-size: 8px;">${qrData.verification.code}</code><br/>
                  <strong>Krijuar:</strong><br/>
                  ${format(new Date(qrData.verification.generatedAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
              
              <div class="footer-info">
                <p><strong>LindDoors</strong></p>
                <p>Data e Printimit: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <p>Faturë e Vlefshme</p>
                <div style="margin-top: 10px; font-size: 10px;">
                  <strong>QR Version:</strong> ${qrData.metadata.qrVersion}<br/>
                  <strong>Dokument:</strong> ${qrData.documentType}
                </div>
              </div>
            </div>

            <!-- Print Actions -->
            <div class="print-actions">
              <button onclick="window.print()">🖨️ Printo Faturën</button>
              <button onclick="window.close()" class="secondary">❌ Mbyll</button>
            </div>
          </div>

          <script>
            // Auto-print functionality
            window.addEventListener('load', function() {
              // Focus the window
              window.focus();
              
              // Generate and display QR code
              const qrUrl = '${qrUrl}';
              console.log('QR URL for verification:', qrUrl);
              
              // Optional: Auto-print after a short delay
              // setTimeout(() => window.print(), 500);
            });
          </script>
        </body>
        </html>
      `;

      // Open the invoice in a new window
      const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
      
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        
        // Mark as printed in the database
        try {
          await markSupplementaryOrderAsPrinted(supplementaryOrder.id);
          
          // Update the local state to reflect the change
          setSupplementaryOrders(orders => 
            orders.map(order => 
              order.id === supplementaryOrder.id 
                ? { ...order, eshtePrintuar: true, dataPrintimit: new Date().toISOString() }
                : order
            )
          );
        } catch (error) {
          console.error('Error marking supplementary order as printed:', error);
          // Don't show error to user as the print window opened successfully
        }
      } else {
        alert('Nuk mund të hapet dritarja e printimit. Ju lutemi kontrolloni blokuesin e dritareve popup.');
      }
      
    } catch (error) {
      console.error('Error printing supplementary order invoice:', error);
      setError('Ka ndodhur një gabim gjatë printimit të faturës.');
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'në proces':
      case 'borxh': // Treat debt status as "në proces" since debt info is shown in price field
        return <Badge bg="warning">Në Proces</Badge>;
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      default:
        return <Badge bg="secondary">Në Proces</Badge>; // Default to "Në Proces" for any unknown status
    }
  };
  
  const handlePartialPayment = (order) => {
    setSelectedOrderForPayment(order);
    setShowPartialPaymentModal(true);
  };

  const handlePartialPaymentSuccess = async ({ orderId, paymentAmount, paymentReceiver, isSupplementaryOrder }) => {
    try {
      const result = await addPartialPaymentToSupplementaryOrder(orderId, paymentAmount, paymentReceiver);
      
      // Update the order in the list
      setSupplementaryOrders(orders => 
        orders.map(order => 
          order.id === orderId ? result.supplementaryOrder : order
        )
      );
      
      // Show success message
      setError('');
      alert(result.message);
      
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  const handleCancelPayment = async (order) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të anuloni pagesën për këtë porosi shtesë?')) {
      return;
    }
    
    try {
      await updateSupplementaryOrderPaymentStatus(order.id, false);
      
      setSupplementaryOrders(orders => 
        orders.map(o => 
          o.id === order.id ? { ...o, isPaymentDone: false } : o
        )
      );
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë anulimit të pagesës');
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

      {/* Time Filter Controls */}
      <Card className="mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <Calendar3 className="me-2 text-primary" size={20} />
                  <strong>Filtro sipas kohës (data e dorëzimit të porosisë kryesore):</strong>
                </div>
                
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant={timeFilter === 'currentWeek' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('currentWeek')}
                  >
                    Java Aktuale
                  </Button>
                  <Button
                    variant={timeFilter === 'nextWeek' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('nextWeek')}
                  >
                    Java e Ardhshme
                  </Button>
                  <Button
                    variant={timeFilter === 'currentMonth' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('currentMonth')}
                  >
                    Muaji Aktual
                  </Button>
                  <Button
                    variant={timeFilter === 'nextMonth' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('nextMonth')}
                  >
                    Muaji i Ardhshëm
                  </Button>
                  <Button
                    variant={timeFilter === 'custom' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('custom')}
                  >
                    Interval i Personalizuar
                  </Button>
                  <Button
                    variant={timeFilter === 'all' ? 'warning' : 'outline-warning'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('all')}
                  >
                    Të Gjitha
                  </Button>
                </div>
              </div>
              
              {/* Custom Date Range */}
              {timeFilter === 'custom' && (
                <Row className="mt-3">
                  <Col md={4}>
                    <Form.Label className="small">Data e fillimit:</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small">Data e mbarimit:</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </Col>
                </Row>
              )}
              
              {/* Filter Description */}
              <div className="mt-2">
                <Badge bg="info" className="me-2">
                  {filteredOrders.length} porosi shtesë
                </Badge>
                <small className="text-muted">
                  Duke shfaqur: <strong>{getFilterDescription()}</strong>
                </small>
              </div>
            </Col>
            
            <Col md={4} className="text-end">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={toggleSortOrder}
              >
                <ArrowRepeat className="me-2" size={16} />
                {sortOrder === 'desc' ? 'Më të vjetrat para' : 'Më të rejat para'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {isManager && (
        <Alert variant="info" className="mb-4">
          <InfoCircle className="me-2" size={16} />
          <strong>Njoftim për Menaxherin:</strong> Ju mund të shikoni të gjitha porositë shtesë dhe të editoni informacionet e përgjithshme, por nuk mund të fshini porosi ose menaxhoni pagesat. Informacionet financiare janë të rezervuara vetëm për administratorin.
        </Alert>
      )}
      
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
            placeholder="Kërko sipas emrit, telefonit ose përshkrimit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Të Gjitha Statuset</option>
            <option value="inProcess">Në Proces</option>
            <option value="completed">Të Përfunduara</option>
            <option value="unpaid">Të Papaguara</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID Shtesë</th>
            <th>ID Kryesore</th>
            <th>Klienti</th>
            <th>Produkti</th>
            <th>Çmimi</th>
            <th>Statusi</th>
            <th>Data e Dorëzimit (Kryesore)</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>#{order.parentOrderId}</td>
              <td>
                <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br/>
                <small className="text-muted">{order.numriTelefonit}</small><br/>
                <small className="text-muted">{order.vendi}</small>
              </td>
              <td>
                <div title={order.pershkrimiProduktit}>
                  {order.pershkrimiProduktit?.length > 50 
                    ? `${order.pershkrimiProduktit.substring(0, 50)}...` 
                    : order.pershkrimiProduktit}
                </div>
              </td>
              <td>
                {parseFloat(order.cmimiTotal).toFixed(2)} €<br/>
                <small>
                  {order.isPaymentDone ? 
                    <Badge bg="success">Paguar</Badge> : 
                    <Badge bg="danger">Papaguar: {(parseFloat(order.cmimiTotal) - parseFloat(order.kaparja || 0)).toFixed(2)} €</Badge>
                  }
                </small>
              </td>
              <td>{getStatusBadge(order.statusi)}</td>
              <td>
                {order.parentOrderInfo?.dita ? 
                  format(new Date(order.parentOrderInfo.dita), 'dd/MM/yyyy') : 
                  <span className="text-muted">Pa datë</span>
                }
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {canEditOrders && (
                    <Button 
                      variant="info" 
                      size="sm" 
                      onClick={() => handleEdit(order)}
                    >
                      <i className="bi bi-pencil"></i> Edito
                    </Button>
                  )}
                  
                  {!order.isPaymentDone && canManagePayments && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handlePartialPayment(order)}
                    >
                      Paguaj
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
                      onClick={() => handleCancelPayment(order)}
                    >
                      Anulo Pagesën
                    </Button>
                  )}
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handlePrintInvoice(order)}
                  >
                    Printo
                  </Button>
                  
                  {canDeleteOrders && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(order.id)}
                  >
                    Fshi
                  </Button>
                  )}
                  
                  {isManager && !canDeleteOrders && (
                    <small className="text-muted align-self-center">
                      Editim i kufizuar
                    </small>
                  )}
                </div>
              </td>
            </tr>
          ))}
          
          {filteredOrders.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center py-4">
                {timeFilter !== 'all' ? 
                  <>
                    Nuk ka porosi shtesë për {getFilterDescription().toLowerCase()}
                    <div className="mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleTimeFilterChange('all')}
                      >
                        Shiko të gjitha porositë shtesë
                      </Button>
                    </div>
                  </> :
                  (searchTerm || filter !== 'all' ? 
                    'Nuk u gjetën porosi shtesë me kriteret e zgjedhura' : 
                    'Nuk ka porosi shtesë të regjistruara')
                }
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Edit Supplementary Order Modal */}
      <SupplementaryOrderEditForm
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedOrderForEdit(null);
        }}
        supplementaryOrder={selectedOrderForEdit}
        parentOrder={selectedOrderForEdit?.parentOrderInfo}
        onSuccess={handleEditSuccess}
      />
      
      {/* Partial Payment Modal */}
      <PartialPaymentModal
        show={showPartialPaymentModal}
        onHide={() => {
          setShowPartialPaymentModal(false);
          setSelectedOrderForPayment(null);
        }}
        supplementaryOrder={selectedOrderForPayment}
        onPaymentSuccess={handlePartialPaymentSuccess}
      />
    </Container>
  );
};

export default AdditionalOrdersPage; 