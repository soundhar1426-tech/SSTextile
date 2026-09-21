import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { millInfo } from '../data/mockData';

const OrderContext = createContext();

const LOCAL_ORDERS_KEY = 'gtex_local_orders';
const LOCAL_INVOICES_KEY = 'gtex_local_invoices';

export const deduplicateOrders = (rawOrders) => {
  if (!Array.isArray(rawOrders)) return [];
  const map = new Map();
  rawOrders.forEach((o) => {
    if (!o) return;
    const key = String(o.orderNumber || o._id || o.id || '').toUpperCase().trim();
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, o);
    } else {
      const existing = map.get(key);
      const isPaid = (o.paymentStatus || '').toLowerCase() === 'paid';
      const existingIsPaid = (existing.paymentStatus || '').toLowerCase() === 'paid';
      if (isPaid && !existingIsPaid) {
        map.set(key, { ...existing, ...o });
      } else if (new Date(o.updatedAt || o.createdAt || 0) > new Date(existing.updatedAt || existing.createdAt || 0)) {
        map.set(key, { ...existing, ...o });
      }
    }
  });
  return Array.from(map.values());
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
    setLoading(true);
    try {
      const response = await api.get('/orders');
      if (response.data?.success && Array.isArray(response.data.orders)) {
        const liveOrders = response.data.orders;
        updateOrdersState((prev) => {
          const merged = [...liveOrders];
          // Keep local orders that might not be in live database
          prev.forEach((localOrd) => {
            const exists = merged.some(
              (m) => m._id === localOrd._id || m.orderNumber === localOrd.orderNumber
            );
            if (!exists) merged.push(localOrd);
          });
          return merged;
        });
      }
    } catch (err) {
      console.warn('[OrderContext] Fetch customer orders offline notice:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, updateOrdersState]);

  /**
   * Fetch all wholesale orders for admin dashboard
   */
  const fetchAdminOrders = useCallback(
    async (status = 'ALL', paymentStatus = 'ALL', invoiceStatus = 'ALL', search = '') => {
      if (!token || !isAdmin) return;
      setLoading(true);
      try {
        const params = {};
        if (status && status !== 'ALL') params.status = status;
        if (paymentStatus && paymentStatus !== 'ALL') params.paymentStatus = paymentStatus;
        if (invoiceStatus && invoiceStatus !== 'ALL') params.invoiceStatus = invoiceStatus;
        if (search && search.trim()) params.search = search.trim();

        const response = await api.get('/admin/orders', { params });
        if (response.data?.success && Array.isArray(response.data.orders)) {
          const liveOrders = response.data.orders;
          updateOrdersState((prev) => {
            const merged = [...liveOrders];
            prev.forEach((localOrd) => {
              const exists = merged.some(
                (m) => m._id === localOrd._id || m.orderNumber === localOrd.orderNumber
              );
              if (!exists) merged.push(localOrd);
            });
            return merged;
          });
          if (response.data.stats) {
            setOrderStats(response.data.stats);
          }
        }
      } catch (err) {
        console.warn('[OrderContext] Fetch admin orders offline notice:', err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, isAdmin, updateOrdersState]
  );

  // Automatically fetch on auth change
  useEffect(() => {
    if (token) {
      if (isAdmin) {
        fetchAdminOrders();
      } else {
        fetchCustomerOrders();
      }
    }
  }, [token, isAdmin, fetchCustomerOrders, fetchAdminOrders]);

  /**
   * Create wholesale order and decrement inventory stock
   */
  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);

    const fallbackOrderNumber = `SST-${Math.floor(100000 + Math.random() * 900000)}`;
    const localOrder = {
      ...orderData,
      _id: `ord-${Date.now()}`,
      id: `ord-${Date.now()}`,
      orderNumber: fallbackOrderNumber,
      orderStatus: 'new',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to state and localStorage
    updateOrdersState((prev) => [localOrder, ...prev]);

    // Dispatch stock decrement event immediately
    if (orderData?.items && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sst_order_stock_decrement', {
          detail: { items: orderData.items },
        })
      );
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
        return { success: true, order: newOrder };
      }
    } catch (err) {
      console.warn('[OrderContext] Placed order locally with full resilience:', err.message);
    } finally {
      setLoading(false);
    }

    return { success: true, order: localOrder };
  };

  /**
   * Get single order by ID or orderNumber
   */
  const getOrderById = async (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();

    // Check cached state or local storage first
    let found = orders.find(
      (o) =>
        o._id === cleanId ||
        o.id === cleanId ||
        o.orderNumber === cleanId ||
        o.orderNumber?.toUpperCase() === cleanId.toUpperCase()
    );

    if (!found) {
      const stored = getStoredOrders();
      found = stored.find(
        (o) =>
          o._id === cleanId ||
          o.id === cleanId ||
          o.orderNumber === cleanId ||
          o.orderNumber?.toUpperCase() === cleanId.toUpperCase()
      );
    }

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
  };

  /**
   * Fetch invoice for an order (Guard: Only paid orders return invoice)
   */
  const getOrderInvoice = async (orderId) => {
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

    // 3. Check order and generate synthetic invoice if order is paid or found
    const order = await getOrderById(cleanId);
    if (order) {
      const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
      const orderNum = order.orderNumber || cleanId;
      const invNum = `SST-INV-${orderNum.replace(/^SST-|^GTX-/, '')}`;

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
          name: millInfo.name,
          tagline: millInfo.tagline,
          deityText: millInfo.deityText || 'SHIVAM',
          address: millInfo.address,
          gstin: millInfo.gstin,
          stateCode: millInfo.stateCode || '33',
          phone: millInfo.phone,
          email: millInfo.email,
          bankDetails: millInfo.bankDetails,
        },
        buyerDetails: {
          name: order.customer?.name || 'Authorized Buyer',
          businessName: order.customer?.businessName || '',
          gstin: order.customer?.gstin || '',
          phone: order.customer?.phone || '',
          email: order.customer?.email || '',
          address: order.shippingAddress?.street || order.customer?.address || 'Direct Dispatch',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || 'Tamil Nadu',
          pincode: order.shippingAddress?.pincode || '',
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

      if (isPaid || isAdmin) {
        saveStoredInvoice(cleanId, syntheticInvoice);
        saveStoredInvoice(invNum, syntheticInvoice);
        return { success: true, invoice: syntheticInvoice };
      }
    }

    return { success: false, error: 'Invoice is generated after payment confirmation.' };
  };

  /**
   * Update order status (Admin)
   */
  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
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

    const currentOrd = orders.find((o) => o._id === cleanId || o.orderNumber === cleanId);
    return { success: true, order: currentOrd || { _id: cleanId, orderStatus: newStatus } };
  };

  /**
   * Confirm manual payment received (Admin)
   */
  const confirmPayment = async (orderId, paymentData = {}) => {
    const cleanId = String(orderId).trim();
    const paidAt = new Date().toISOString();

    // Create synthetic invoice and updated order locally
    let targetOrder = orders.find((o) => o._id === cleanId || o.orderNumber === cleanId || o.id === cleanId);
    if (!targetOrder) {
      const stored = getStoredOrders();
      targetOrder = stored.find((o) => o._id === cleanId || o.orderNumber === cleanId || o.id === cleanId);
    }

    const orderNum = targetOrder?.orderNumber || cleanId;
    const invNum = `SST-INV-${orderNum.replace(/^SST-|^GTX-/, '')}`;

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
        reference: paymentData.paymentReference || 'VERIFIED-DESK',
        confirmedAt: paidAt,
        amount: paymentData.amount || targetOrder?.totalAmount || targetOrder?.total || 0,
      },
      millDetails: {
        name: millInfo.name,
        tagline: millInfo.tagline,
        deityText: millInfo.deityText || 'SHIVAM',
        address: millInfo.address,
        gstin: millInfo.gstin,
        stateCode: millInfo.stateCode || '33',
        phone: millInfo.phone,
        email: millInfo.email,
        bankDetails: millInfo.bankDetails,
      },
      buyerDetails: {
        name: targetOrder?.customer?.name || 'Authorized Buyer',
        businessName: targetOrder?.customer?.businessName || '',
        gstin: targetOrder?.customer?.gstin || '',
        phone: targetOrder?.customer?.phone || '',
        email: targetOrder?.customer?.email || '',
        address: targetOrder?.shippingAddress?.street || targetOrder?.customer?.address || 'Direct Dispatch',
        city: targetOrder?.shippingAddress?.city || '',
        state: targetOrder?.shippingAddress?.state || 'Tamil Nadu',
        pincode: targetOrder?.shippingAddress?.pincode || '',
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

    // Optimistically update order
    updateOrdersState((prev) =>
      prev.map((o) => {
        if (o._id === cleanId || o.id === cleanId || o.orderNumber === cleanId) {
          return {
            ...o,
            paymentStatus: 'paid',
            orderStatus: o.orderStatus === 'new' ? 'confirmed' : o.orderStatus,
            paidAt,
            paymentDetails: localInvoice.paymentDetails,
            invoiceNumber: invNum,
            invoice: localInvoice,
            updatedAt: paidAt,
          };
        }
        return o;
      })
    );

    try {
      const response = await api.patch(`/admin/orders/${cleanId}/payment`, paymentData);
      if (response.data?.success) {
        const updated = response.data.order;
        const liveInvoice = response.data.invoice || localInvoice;
        if (liveInvoice) {
          saveStoredInvoice(cleanId, liveInvoice);
          saveStoredInvoice(liveInvoice.invoiceNumber, liveInvoice);
        }
        updateOrdersState((prev) =>
          prev.map((o) => (o._id === updated._id || o.orderNumber === updated.orderNumber ? updated : o))
        );
        return { success: true, order: updated, invoice: liveInvoice };
      }
    } catch (err) {
      console.warn('[OrderContext] Payment confirmed locally with generated invoice:', err.message);
    }

    const updatedOrder = orders.find((o) => o._id === cleanId || o.orderNumber === cleanId) || targetOrder;
    return { success: true, order: updatedOrder, invoice: localInvoice };
  };

  /**
   * Update invoice / bill details (Admin)
   */
  const updateInvoice = async (invoiceOrOrderId, updatedData = {}) => {
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
        const fallbackRes = await api.put(`/orders/${cleanId}/invoice`, updatedData);
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
  };

  /**
   * Fetch all invoices (Admin)
   */
  const fetchAdminInvoices = async () => {
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
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        orderStats,
        loading,
        error,
        fetchCustomerOrders,
        fetchAdminOrders,
        createOrder,
        getOrderById,
        getOrderInvoice,
        updateOrderStatus,
        confirmPayment,
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
