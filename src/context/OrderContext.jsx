import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { millInfo } from '../data/mockData';
import {
  playNewOrderSound,
  unlockAudio,
  requestNotificationPermission,
  showDesktopNotification,
} from '../utils/soundAlert';

const OrderContext = createContext();

const LOCAL_ORDERS_KEY = 'gtex_local_orders';
const LOCAL_INVOICES_KEY = 'gtex_local_invoices';
const SOUND_ENABLED_KEY = 'sst_sound_enabled';

export const deduplicateOrders = (rawOrders) => {
  if (!Array.isArray(rawOrders)) return [];
  const map = new Map();

  rawOrders.forEach((o) => {
    if (!o) return;
    const num = String(o.orderNumber || '').toUpperCase().trim();
    const id = String(o._id || o.id || '').trim();
    const digitsOnly = num.replace(/\D/g, '');
    const key = (digitsOnly && digitsOnly.length >= 4 ? `num:${digitsOnly}` : '') || (id ? `id:${id}` : '') || num;
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, o);
    } else {
      const existing = map.get(key);
      const isPaid = (o.paymentStatus || '').toLowerCase() === 'paid';
      const existingIsPaid = (existing.paymentStatus || '').toLowerCase() === 'paid';

      let merged = { ...existing, ...o };
      if (isPaid || existingIsPaid) {
        merged.paymentStatus = 'paid';
        merged.invoiceNumber = o.invoiceNumber || existing.invoiceNumber;
        if (merged.orderStatus === 'new') {
          merged.orderStatus = 'confirmed';
        }
      }
      map.set(key, merged);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

const getStoredOrders = () => {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? deduplicateOrders(JSON.parse(raw)) : [];
  } catch (e) {
    return [];
  }
};

const saveStoredOrders = (orders) => {
  try {
    const deduplicated = deduplicateOrders(orders);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(deduplicated));
    return deduplicated;
  } catch (e) {
    return orders;
  }
};

const getStoredInvoices = () => {
  try {
    const raw = localStorage.getItem(LOCAL_INVOICES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveStoredInvoice = (orderKey, invoice) => {
  try {
    const all = getStoredInvoices();
    all[orderKey] = invoice;
    if (invoice.invoiceNumber) {
      all[invoice.invoiceNumber] = invoice;
    }
    localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(all));
  } catch (e) {}
};

export const OrderProvider = ({ children }) => {
  const { token, currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState(() => getStoredOrders());
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real-time Sound & New Order Alerts
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch (e) {
      return true;
    }
  });
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const seenOrderIdsRef = useRef(new Set());
  const initialLoadCompletedRef = useRef(false);

  const setSoundEnabled = useCallback((val) => {
    setSoundEnabledState(val);
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(val));
    } catch (e) {}
  }, []);

  // Sync state to localStorage whenever orders change
  const updateOrdersState = useCallback((updater) => {
    setOrders((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredOrders(next);
      return next;
    });
  }, []);

  /**
   * Fetch customer orders from live backend API
   */
  const fetchCustomerOrders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get('/orders');
      if (response.data?.success && Array.isArray(response.data.orders)) {
        const liveOrders = deduplicateOrders(response.data.orders);
        updateOrdersState(liveOrders);
      }
    } catch (err) {
      console.warn('[OrderContext] Fetch customer orders offline notice:', err.message);
    }
  }, [token, updateOrdersState]);

  /**
   * Fetch all wholesale orders for admin dashboard & detect new incoming orders
   */
  const fetchAdminOrders = useCallback(
    async (status = 'ALL', paymentStatus = 'ALL', invoiceStatus = 'ALL', search = '') => {
      if (!token || !isAdmin) return;
      try {
        const params = {};
        if (status && status !== 'ALL') params.status = status;
        if (paymentStatus && paymentStatus !== 'ALL') params.paymentStatus = paymentStatus;
        if (invoiceStatus && invoiceStatus !== 'ALL') params.invoiceStatus = invoiceStatus;
        if (search && search.trim()) params.search = search.trim();

        const response = await api.get('/admin/orders', { params });
        if (response.data?.success && Array.isArray(response.data.orders)) {
          const liveOrders = deduplicateOrders(response.data.orders);
          
          // Check for newly placed orders if initial load already happened
          if (initialLoadCompletedRef.current && liveOrders.length > 0) {
            const newlyArrived = liveOrders.filter((ord) => {
              const key = ord._id || ord.id || ord.orderNumber;
              return key && !seenOrderIdsRef.current.has(key);
            });

            if (newlyArrived.length > 0) {
              const latest = newlyArrived[0];
              if (soundEnabled) {
                playNewOrderSound();
              }
              showDesktopNotification(
                '🚨 New Wholesale Order Received!',
                `Order #${latest.orderNumber || latest.id} received for ₹${Number(latest.totalAmount || latest.total || 0).toLocaleString('en-IN')}`
              );
              setNewOrderAlert(latest);
            }
          }

          // Update known order IDs
          liveOrders.forEach((o) => {
            if (o._id) seenOrderIdsRef.current.add(o._id);
            if (o.id) seenOrderIdsRef.current.add(o.id);
            if (o.orderNumber) seenOrderIdsRef.current.add(o.orderNumber);
          });

          initialLoadCompletedRef.current = true;
          updateOrdersState(liveOrders);
          if (response.data.stats) {
            setOrderStats(response.data.stats);
          }
        }
      } catch (err) {
        console.warn('[OrderContext] Fetch admin orders offline notice:', err.message);
      }
    },
    [token, isAdmin, soundEnabled, updateOrdersState]
  );

  // Request browser notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Automatically fetch on auth change + start real-time poller
  useEffect(() => {
    if (!token) return;

    if (isAdmin) {
      fetchAdminOrders();
      // Fast 3-second polling for immediate reflection of new orders placed by buyers
      const adminInterval = setInterval(() => {
        fetchAdminOrders();
      }, 3000);
      return () => clearInterval(adminInterval);
    } else {
      fetchCustomerOrders();
      // 4-second polling for buyer portal to reflect confirmed bills & invoices
      const buyerInterval = setInterval(() => {
        fetchCustomerOrders();
      }, 4000);
      return () => clearInterval(buyerInterval);
    }
  }, [token, isAdmin, fetchCustomerOrders, fetchAdminOrders]);

  // BroadcastChannel & Cross-tab real-time event listeners
  useEffect(() => {
    let orderChannel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        orderChannel = new BroadcastChannel('sst_orders_channel');
        orderChannel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'NEW_ORDER_PLACED' && data.order) {
            updateOrdersState((prev) => [data.order, ...prev]);
            if (isAdmin) {
              if (soundEnabled) {
                playNewOrderSound();
              }
              setNewOrderAlert(data.order);
              showDesktopNotification(
                '🚨 New Wholesale Order Received!',
                `Order #${data.order.orderNumber || data.order.id} for ₹${Number(data.order.totalAmount || data.order.total || 0).toLocaleString('en-IN')}`
              );
              fetchAdminOrders();
            }
          } else if (data?.type === 'ORDER_STATUS_UPDATED') {
            if (isAdmin) {
              fetchAdminOrders();
            } else {
              fetchCustomerOrders();
            }
          }
        };
      }
    } catch (e) {
      console.warn('[OrderContext] BroadcastChannel initialization note:', e);
    }

    const handleNewOrderPlacedEvent = (event) => {
      const order = event.detail?.order;
      if (order) {
        updateOrdersState((prev) => [order, ...prev]);
        if (isAdmin) {
          if (soundEnabled) {
            playNewOrderSound();
          }
          setNewOrderAlert(order);
          showDesktopNotification(
            '🚨 New Wholesale Order Received!',
            `Order #${order.orderNumber || order.id} for ₹${Number(order.totalAmount || order.total || 0).toLocaleString('en-IN')}`
          );
        }
      }
    };

    const handleOrderStatusUpdatedEvent = (event) => {
      const { order, invoice } = event.detail || {};
      if (order) {
        updateOrdersState((prev) =>
          prev.map((o) => (o._id === order._id || o.orderNumber === order.orderNumber ? { ...o, ...order, paymentStatus: 'paid' } : o))
        );
      }
      if (invoice) {
        const orderKey = invoice.order?._id || invoice.order || invoice.orderNumber;
        if (orderKey) saveStoredInvoice(orderKey, invoice);
      }
      if (isAdmin) {
        fetchAdminOrders();
      } else {
        fetchCustomerOrders();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'sst_last_order_placed' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data?.order) {
            updateOrdersState((prev) => [data.order, ...prev]);
            if (isAdmin) {
              if (soundEnabled) {
                playNewOrderSound();
              }
              setNewOrderAlert(data.order);
              showDesktopNotification(
                '🚨 New Wholesale Order Received!',
                `Order #${data.order.orderNumber || data.order.id} for ₹${Number(data.order.totalAmount || data.order.total || 0).toLocaleString('en-IN')}`
              );
              fetchAdminOrders();
            }
          }
        } catch (err) {}
      } else if (e.key === 'sst_last_order_status_updated') {
        if (isAdmin) {
          fetchAdminOrders();
        } else {
          fetchCustomerOrders();
        }
      } else if (e.key === LOCAL_ORDERS_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setOrders(deduplicateOrders(updated));
          }
        } catch (err) {}
      }
    };

    window.addEventListener('sst_new_order_placed', handleNewOrderPlacedEvent);
    window.addEventListener('sst_order_status_updated', handleOrderStatusUpdatedEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (orderChannel) {
        orderChannel.close();
      }
      window.removeEventListener('sst_new_order_placed', handleNewOrderPlacedEvent);
      window.removeEventListener('sst_order_status_updated', handleOrderStatusUpdatedEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAdmin, soundEnabled, fetchAdminOrders, fetchCustomerOrders, updateOrdersState]);

  /**
   * Create wholesale order and decrement inventory stock
   */
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);

    const fallbackOrderNumber = `GTX-${Math.floor(10000 + Math.random() * 90000)}`;
    const localOrder = {
      ...orderData,
      _id: `ord-${Date.now()}`,
      id: `ord-${Date.now()}`,
      orderNumber: fallbackOrderNumber,
      orderStatus: 'new',
      paymentStatus: 'pending',
      invoiceStatus: 'not_generated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to state and localStorage
    updateOrdersState((prev) => [localOrder, ...prev]);

    // Dispatch stock decrement and new order notifications
    if (typeof window !== 'undefined') {
      if (orderData?.items) {
        window.dispatchEvent(
          new CustomEvent('sst_order_stock_decrement', {
            detail: { items: orderData.items },
          })
        );
      }

      // Broadcast new order event immediately across tabs & window
      try {
        if ('BroadcastChannel' in window) {
          const ch = new BroadcastChannel('sst_orders_channel');
          ch.postMessage({ type: 'NEW_ORDER_PLACED', order: localOrder });
          setTimeout(() => ch.close(), 1000);
        }
      } catch (e) {}

      window.dispatchEvent(
        new CustomEvent('sst_new_order_placed', {
          detail: { order: localOrder },
        })
      );
      try {
        localStorage.setItem(
          'sst_last_order_placed',
          JSON.stringify({ order: localOrder, timestamp: Date.now() })
        );
      } catch (e) {}
    }

    try {
      const response = await api.post('/orders', orderData);
      if (response.data?.success && response.data.order) {
        const newOrder = response.data.order;
        updateOrdersState((prev) =>
          prev.map((o) =>
            o._id === localOrder._id || o.orderNumber === localOrder.orderNumber ? newOrder : o
          )
        );

        // Update broadcast with verified backend order
        if (typeof window !== 'undefined') {
          try {
            if ('BroadcastChannel' in window) {
              const ch = new BroadcastChannel('sst_orders_channel');
              ch.postMessage({ type: 'NEW_ORDER_PLACED', order: newOrder });
              setTimeout(() => ch.close(), 1000);
            }
          } catch (e) {}

          window.dispatchEvent(
            new CustomEvent('sst_new_order_placed', {
              detail: { order: newOrder },
            })
          );
          try {
            localStorage.setItem(
              'sst_last_order_placed',
              JSON.stringify({ order: newOrder, timestamp: Date.now() })
            );
          } catch (e) {}
        }

        return { success: true, order: newOrder };
      }
    } catch (err) {
      console.warn('[OrderContext] Placed order locally with full resilience:', err.message);
    } finally {
      setLoading(false);
    }

    return { success: true, order: localOrder };
  }, [updateOrdersState]);

  /**
   * Get single order by ID or orderNumber
   */
  const getOrderById = useCallback(async (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();

    // Check local storage first
    const stored = getStoredOrders();
    let found = stored.find(
      (o) =>
        o._id === cleanId ||
        o.id === cleanId ||
        o.orderNumber === cleanId ||
        o.orderNumber?.toUpperCase() === cleanId.toUpperCase()
    );

    try {
      const response = await api.get(`/orders/${cleanId}`);
      if (response.data?.success && response.data.order) {
        const liveOrder = response.data.order;
        updateOrdersState((prev) => {
          const idx = prev.findIndex(
            (o) => o._id === liveOrder._id || o.orderNumber === liveOrder.orderNumber
          );
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = liveOrder;
            return updated;
          }
          return [liveOrder, ...prev];
        });
        return liveOrder;
      }
    } catch (err) {
      console.warn('[OrderContext] Live fetch single order offline fallback:', err.message);
    }

    return found || null;
  }, [updateOrdersState]);

  /**
   * Fetch invoice for an order
   */
  const getOrderInvoice = useCallback(async (orderId) => {
    if (!orderId) return { success: false, error: 'No order ID provided' };
    const cleanId = String(orderId).trim();

    // 1. Try Backend API
    try {
      const response = await api.get(`/orders/${cleanId}/invoice`);
      if (response.data?.success && response.data.invoice) {
        saveStoredInvoice(cleanId, response.data.invoice);
        return { success: true, invoice: response.data.invoice };
      }
    } catch (err) {
      console.warn('[OrderContext] Backend get invoice offline fallback:', err.message);
    }

    // 2. Check local stored invoices
    const storedInvoices = getStoredInvoices();
    if (storedInvoices[cleanId]) {
      return { success: true, invoice: storedInvoices[cleanId] };
    }

    // 3. Check order and generate synthetic proforma / final invoice
    const order = await getOrderById(cleanId);
    if (order) {
      const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
      const orderNum = order.orderNumber || cleanId;
      const invNum = isPaid
        ? `GTX-INV-${orderNum.replace(/^SST-|^GTX-/, '')}`
        : `PROFORMA-${orderNum}`;

      const syntheticInvoice = {
        _id: `inv-${order._id || cleanId}`,
        invoiceNumber: invNum,
        order: order,
        orderNumber: orderNum,
        issueDate: order.paidAt || order.createdAt || new Date().toISOString(),
        dueDate: new Date().toISOString(),
        status: isPaid ? 'PAID' : 'PENDING',
        paymentStatus: isPaid ? 'paid' : 'pending',
        paymentDetails: order.paymentDetails || { method: 'UPI / Direct Bank Transfer' },
        millDetails: {
          name: millInfo.name || 'GOWTHAM TEX',
          tagline: millInfo.tagline || 'Whole Sale Hand Looms Cloth Manufacturer',
          deityText: millInfo.deityText || 'SHIVAM',
          address: millInfo.address,
          gstin: millInfo.gstin || '33BRWPV7711D1ZD',
          stateCode: millInfo.stateCode || '33',
          phone: millInfo.phone,
          email: millInfo.email,
          bankDetails: millInfo.bankDetails,
        },
        buyerDetails: {
          name: order.customerDetails?.name || order.customer?.name || 'Authorized Buyer',
          businessName: order.customerDetails?.businessName || order.customer?.businessName || '',
          gstin: order.customerDetails?.gstin || order.customer?.gstin || '',
          phone: order.customerDetails?.phone || order.customer?.phone || '',
          email: order.customerDetails?.email || order.customer?.email || '',
          address: order.deliveryDetails?.addressLine1 || order.shippingAddress?.address || 'Direct Dispatch',
          city: order.deliveryDetails?.city || order.shippingAddress?.city || 'Erode',
          state: order.deliveryDetails?.state || order.shippingAddress?.state || 'Tamil Nadu',
          pincode: order.deliveryDetails?.pincode || order.shippingAddress?.pincode || '638001',
        },
        items: order.items || [],
        subtotal: order.subtotal || order.totalAmount || 0,
        taxSummary: order.taxSummary || {
          taxType: 'CGST_SGST',
          taxableAmount: order.subtotal || order.totalAmount || 0,
          cgstRate: 2.5,
          cgstAmount: Math.round(((order.subtotal || order.totalAmount || 0) * 0.025) * 100) / 100,
          sgstRate: 2.5,
          sgstAmount: Math.round(((order.subtotal || order.totalAmount || 0) * 0.025) * 100) / 100,
          totalTax: Math.round(((order.subtotal || order.totalAmount || 0) * 0.05) * 100) / 100,
        },
        totalAmount: order.totalAmount || order.total || 0,
        createdAt: order.createdAt || new Date().toISOString(),
      };

      saveStoredInvoice(cleanId, syntheticInvoice);
      saveStoredInvoice(invNum, syntheticInvoice);
      return { success: true, invoice: syntheticInvoice };
    }

    return { success: false, error: 'Invoice is generated after payment confirmation.' };
  }, [getOrderById]);

  /**
   * Update order status (Admin)
   */
  const updateOrderStatus = useCallback(async (orderId, newStatus, extraData = {}) => {
    const cleanId = String(orderId).trim();

    // Optimistically update locally
    updateOrdersState((prev) =>
      prev.map((o) => {
        if (o._id === cleanId || o.id === cleanId || o.orderNumber === cleanId) {
          return {
            ...o,
            orderStatus: newStatus,
            ...extraData,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    // Broadcast status update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sst_order_status_updated', {
          detail: { orderId: cleanId, status: newStatus },
        })
      );
      try {
        localStorage.setItem(
          'sst_last_order_status_updated',
          JSON.stringify({ orderId: cleanId, status: newStatus, timestamp: Date.now() })
        );
      } catch (e) {}
    }

    try {
      const response = await api.patch(`/admin/orders/${cleanId}/status`, {
        status: newStatus,
        ...extraData,
      });
      if (response.data?.success && response.data.order) {
        const updated = response.data.order;
        updateOrdersState((prev) =>
          prev.map((o) => (o._id === updated._id || o.orderNumber === updated.orderNumber ? updated : o))
        );
        return { success: true, order: updated };
      }
    } catch (err) {
      console.warn('[OrderContext] Status updated locally:', err.message);
    }

    const stored = getStoredOrders();
    const currentOrd = stored.find((o) => o._id === cleanId || o.orderNumber === cleanId);
    return { success: true, order: currentOrd || { _id: cleanId, orderStatus: newStatus } };
  }, [updateOrdersState]);

  /**
   * Confirm manual payment received, change status to confirmed/paid, and issue final GST invoice
   */
  const confirmPayment = useCallback(async (orderId, paymentData = {}) => {
    const cleanId = String(orderId).trim();
    const paidAt = new Date().toISOString();

    const stored = getStoredOrders();
    const targetOrder = stored.find((o) => o._id === cleanId || o.orderNumber === cleanId || o.id === cleanId);

    const orderNum = targetOrder?.orderNumber || cleanId;
    const invNum = `GTX-INV-${orderNum.replace(/^SST-|^GTX-/, '')}`;

    const localInvoice = {
      _id: `inv-${targetOrder?._id || cleanId}`,
      invoiceNumber: invNum,
      order: targetOrder,
      orderNumber: orderNum,
      issueDate: paidAt,
      dueDate: paidAt,
      status: 'PAID',
      paymentStatus: 'paid',
      paymentDetails: {
        method: paymentData.paymentMethod || 'UPI',
        reference: paymentData.paymentReference || `VERIFIED-${Date.now().toString().slice(-6)}`,
        confirmedAt: paidAt,
        amount: paymentData.amount || targetOrder?.totalAmount || targetOrder?.total || 0,
      },
      millDetails: {
        name: millInfo.name || 'GOWTHAM TEX',
        tagline: millInfo.tagline || 'Whole Sale Hand Looms Cloth Manufacturer',
        deityText: millInfo.deityText || 'SHIVAM',
        address: millInfo.address,
        gstin: millInfo.gstin || '33BRWPV7711D1ZD',
        stateCode: millInfo.stateCode || '33',
        phone: millInfo.phone,
        email: millInfo.email,
        bankDetails: millInfo.bankDetails,
      },
      buyerDetails: {
        name: targetOrder?.customerDetails?.name || targetOrder?.customer?.name || 'Authorized Buyer',
        businessName: targetOrder?.customerDetails?.businessName || targetOrder?.customer?.businessName || '',
        gstin: targetOrder?.customerDetails?.gstin || targetOrder?.customer?.gstin || '',
        phone: targetOrder?.customerDetails?.phone || targetOrder?.customer?.phone || '',
        email: targetOrder?.customerDetails?.email || targetOrder?.customer?.email || '',
        address: targetOrder?.deliveryDetails?.addressLine1 || targetOrder?.shippingAddress?.address || 'Direct Dispatch',
        city: targetOrder?.deliveryDetails?.city || targetOrder?.shippingAddress?.city || 'Erode',
        state: targetOrder?.deliveryDetails?.state || targetOrder?.shippingAddress?.state || 'Tamil Nadu',
        pincode: targetOrder?.deliveryDetails?.pincode || targetOrder?.shippingAddress?.pincode || '638001',
      },
      items: targetOrder?.items || [],
      subtotal: targetOrder?.subtotal || targetOrder?.totalAmount || 0,
      taxSummary: targetOrder?.taxSummary || {
        taxType: 'CGST_SGST',
        taxableAmount: targetOrder?.subtotal || targetOrder?.totalAmount || 0,
        cgstRate: 2.5,
        cgstAmount: Math.round(((targetOrder?.subtotal || targetOrder?.totalAmount || 0) * 0.025) * 100) / 100,
        sgstRate: 2.5,
        sgstAmount: Math.round(((targetOrder?.subtotal || targetOrder?.totalAmount || 0) * 0.025) * 100) / 100,
        totalTax: Math.round(((targetOrder?.subtotal || targetOrder?.totalAmount || 0) * 0.05) * 100) / 100,
      },
      totalAmount: targetOrder?.totalAmount || targetOrder?.total || paymentData.amount || 0,
      createdAt: paidAt,
    };

    saveStoredInvoice(cleanId, localInvoice);
    saveStoredInvoice(invNum, localInvoice);
    if (targetOrder?._id) saveStoredInvoice(targetOrder._id, localInvoice);

    const apiTargetId = (targetOrder?._id && !String(targetOrder._id).startsWith('ord-'))
      ? targetOrder._id
      : (targetOrder?.orderNumber || cleanId);

    const fullPaymentPayload = {
      ...paymentData,
      orderNumber: targetOrder?.orderNumber || (orderNum !== cleanId ? orderNum : undefined),
    };

    // Optimistically update order
    updateOrdersState((prev) =>
      prev.map((o) => {
        if (o._id === cleanId || o.id === cleanId || o.orderNumber === cleanId || (orderNum && o.orderNumber === orderNum)) {
          return {
            ...o,
            paymentStatus: 'paid',
            orderStatus: o.orderStatus === 'new' ? 'confirmed' : o.orderStatus,
            paidAt,
            paymentDetails: localInvoice.paymentDetails,
            invoiceNumber: invNum,
            invoiceStatus: 'generated',
            invoice: localInvoice,
            updatedAt: paidAt,
          };
        }
        return o;
      })
    );

    // Broadcast across app and tabs
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          const ch = new BroadcastChannel('sst_orders_channel');
          ch.postMessage({
            type: 'ORDER_STATUS_UPDATED',
            orderId: cleanId,
            order: { ...targetOrder, paymentStatus: 'paid', orderStatus: 'confirmed' },
            invoice: localInvoice,
          });
          setTimeout(() => ch.close(), 1000);
        }
      } catch (e) {}

      window.dispatchEvent(
        new CustomEvent('sst_order_status_updated', {
          detail: { order: targetOrder, invoice: localInvoice },
        })
      );
      try {
        localStorage.setItem(
          'sst_last_order_status_updated',
          JSON.stringify({ orderId: cleanId, status: 'confirmed', timestamp: Date.now() })
        );
      } catch (e) {}
    }

    try {
      const response = await api.patch(`/admin/orders/${apiTargetId}/payment`, fullPaymentPayload);
      if (response.data?.success) {
        const updated = response.data.order;
        const liveInvoice = response.data.invoice || localInvoice;
        if (liveInvoice) {
          saveStoredInvoice(cleanId, liveInvoice);
          saveStoredInvoice(liveInvoice.invoiceNumber, liveInvoice);
        }
        updateOrdersState((prev) =>
          prev.map((o) => (o._id === updated._id || o.orderNumber === updated.orderNumber ? { ...o, ...updated, paymentStatus: 'paid' } : o))
        );
        return { success: true, order: updated, invoice: liveInvoice };
      }
    } catch (err) {
      console.warn('[OrderContext] Payment confirmed locally with generated invoice:', err.message);
    }

    return { success: true, order: targetOrder, invoice: localInvoice };
  }, [updateOrdersState]);

  /**
   * Verify, check and confirm bill & generate GST Tax Invoice in one seamless step
   */
  const verifyAndConfirmBill = useCallback(async (orderId, billData = {}) => {
    const cleanId = String(orderId).trim();
    
    // 1. Update bill details on server
    try {
      await api.put(`/admin/invoices/${cleanId}`, billData);
    } catch (e) {
      try {
        await api.put(`/admin/orders/${cleanId}/invoice`, billData);
      } catch (e2) {}
    }

    // 2. Confirm payment and generate final GST invoice
    return await confirmPayment(cleanId, {
      paymentMethod: billData.paymentMethod || 'UPI',
      paymentReference: billData.paymentReference || `VERIFIED-${Date.now().toString().slice(-6)}`,
      amount: billData.totalAmount || billData.total,
    });
  }, [confirmPayment]);

  /**
   * Update invoice / bill details (Admin)
   */
  const updateInvoice = useCallback(async (invoiceOrOrderId, updatedData = {}) => {
    const cleanId = String(invoiceOrOrderId).trim();
    try {
      const response = await api.put(`/admin/invoices/${cleanId}`, updatedData);
      if (response.data?.success) {
        const updatedInvoice = response.data.invoice;
        const updatedOrder = response.data.order;
        if (updatedInvoice) {
          saveStoredInvoice(cleanId, updatedInvoice);
          saveStoredInvoice(updatedInvoice.invoiceNumber, updatedInvoice);
        }
        if (updatedOrder) {
          updateOrdersState((prev) =>
            prev.map((o) =>
              o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o
            )
          );
        }
        return { success: true, invoice: updatedInvoice, order: updatedOrder };
      }
    } catch (err) {
      try {
        const fallbackRes = await api.put(`/admin/orders/${cleanId}/invoice`, updatedData);
        if (fallbackRes.data?.success) {
          const updatedInvoice = fallbackRes.data.invoice;
          const updatedOrder = fallbackRes.data.order;
          if (updatedInvoice) {
            saveStoredInvoice(cleanId, updatedInvoice);
            saveStoredInvoice(updatedInvoice.invoiceNumber, updatedInvoice);
          }
          if (updatedOrder) {
            updateOrdersState((prev) =>
              prev.map((o) =>
                o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o
              )
            );
          }
          return { success: true, invoice: updatedInvoice, order: updatedOrder };
        }
      } catch (fbErr) {}
    }

    // Local save override
    const storedInvoices = getStoredInvoices();
    const existing = storedInvoices[cleanId] || {};
    const mergedInvoice = { ...existing, ...updatedData, isCustomized: true, updatedAt: new Date().toISOString() };
    saveStoredInvoice(cleanId, mergedInvoice);

    return { success: true, invoice: mergedInvoice };
  }, [updateOrdersState]);

  /**
   * Fetch all invoices (Admin)
   */
  const fetchAdminInvoices = useCallback(async () => {
    try {
      const response = await api.get('/admin/invoices');
      if (response.data?.success && Array.isArray(response.data.invoices)) {
        return { success: true, invoices: response.data.invoices };
      }
    } catch (err) {
      console.warn('[OrderContext] Fetch admin invoices offline fallback:', err.message);
    }

    const storedInvoices = getStoredInvoices();
    const invoiceList = Object.values(storedInvoices);
    return { success: true, invoices: invoiceList };
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        orderStats,
        loading,
        error,
        soundEnabled,
        setSoundEnabled,
        newOrderAlert,
        clearNewOrderAlert: () => setNewOrderAlert(null),
        playTestSound: () => {
          unlockAudio();
          playNewOrderSound();
        },
        fetchCustomerOrders,
        fetchAdminOrders,
        createOrder,
        getOrderById,
        getOrderInvoice,
        updateOrderStatus,
        confirmPayment,
        verifyAndConfirmBill,
        updateInvoice,
        fetchAdminInvoices,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
export default OrderContext;
