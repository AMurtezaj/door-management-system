import { format } from 'date-fns';

/**
 * Generate simplified QR data with only order details for invoice verification
 * @param {Object} order - Order data
 * @param {Object} user - User who printed the invoice
 * @param {string} documentType - Type of document (INVOICE, SUPPLEMENTARY_INVOICE)
 * @param {Object} parentOrder - Parent order (for supplementary orders)
 * @returns {Object} Simplified QR data structure with only order details
 */
export const generateQRData = (order, user, documentType = 'INVOICE', parentOrder = null) => {
  const printTimestamp = new Date();
  
  // Generate basic verification hash
  const verificationHash = btoa(`${order.id}-${order.emriKlientit}-${printTimestamp.getTime()}`).slice(0, 8).toUpperCase();
  
  return {
    // Document Information (required for verification)
    documentType: documentType,
    companyName: "LindDoors Management System",
    
    // Order Details
    orderDetails: {
      orderId: order.id,
      orderType: order.tipiPorosise,
      status: order.statusi,
      orderDate: order.dita ? format(new Date(order.dita), 'dd/MM/yyyy') : null,
      description: order.pershkrimi || order.pershkrimiProduktit || 'Nuk ka përshkrim'
    },
    
    // Parent Order Information (for supplementary orders only)
    ...(parentOrder && {
      parentOrder: {
        id: parentOrder.id,
        type: parentOrder.tipiPorosise,
        deliveryDate: parentOrder.dita ? format(new Date(parentOrder.dita), 'dd/MM/yyyy') : null
      }
    }),
    
    // Customer Information
    customer: {
      name: `${order.emriKlientit} ${order.mbiemriKlientit}`,
      phone: order.numriTelefonit,
      location: order.vendi
    },
    
    // Financial Information
    financial: {
      totalPrice: parseFloat(order.cmimiTotal).toFixed(2),
      downPayment: parseFloat(order.kaparja || 0).toFixed(2),
      remainingPayment: (parseFloat(order.cmimiTotal) - parseFloat(order.kaparja || 0)).toFixed(2),
      paymentCompleted: order.isPaymentDone ? 'Po' : 'Jo'
    },
    
    // Basic verification
    verification: {
      code: verificationHash,
      generatedAt: printTimestamp.toISOString()
    },
    
    // Metadata
    metadata: {
      qrVersion: "4.0-SIMPLE",
      documentType: documentType
    }
  };
};

/**
 * Generate QR code URL with simplified data
 * @param {Object} qrData - QR data object
 * @param {Object} config - Configuration for URL generation
 * @returns {string} Complete verification URL
 */
export const generateQRUrl = (qrData, config = {}) => {
  // Determine base URL
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  let baseUrl;
  
  if (isDevelopment) {
    // For development, use the configured IP for mobile testing
    const devConfig = config.development || {
      host: '192.168.0.104',
      port: '5173',
      protocol: 'http'
    };
    baseUrl = `${devConfig.protocol}://${devConfig.host}:${devConfig.port}`;
  } else {
    // For production, use the actual domain
    baseUrl = window.location.origin;
  }
  
  const encodedData = encodeURIComponent(JSON.stringify(qrData));
  return `${baseUrl}/verify?data=${encodedData}`;
};

/**
 * Generate fallback QR data (even more simplified version if main generation fails)
 * @param {Object} order - Order data
 * @param {Object} user - User who printed the invoice
 * @param {string} documentType - Type of document
 * @returns {Object} Minimal QR data structure
 */
export const generateFallbackQRData = (order, user, documentType = 'INVOICE') => {
  return {
    // Required fields for verification
    documentType: documentType,
    companyName: "LindDoors Management System",
    orderDetails: {
      orderId: order.id,
      orderType: order.tipiPorosise,
      status: order.statusi
    },
    
    // Basic information
    customer: {
      name: `${order.emriKlientit} ${order.mbiemriKlientit}`
    },
    financial: {
      totalPrice: order.cmimiTotal
    },
    
    // Metadata
    metadata: {
      qrVersion: "4.0-FALLBACK"
    }
  };
}; 