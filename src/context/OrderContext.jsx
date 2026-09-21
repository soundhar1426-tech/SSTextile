import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { token, currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch customer orders from live backend API
   */
  const fetchCustomerOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.warn('[OrderContext] Fetch customer orders:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Fetch all wholesale orders for admin dashboard
   */
  const fetchAdminOrders = useCallback(async (status = 'ALL', paymentStatus = 'ALL', invoiceStatus = 'ALL', search = '') => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const params = {};
      if (status && status !== 'ALL') params.status = status;
      if (paymentStatus && paymentStatus !== 'ALL') params.paymentStatus = paymentStatus;
      if (invoiceStatus && invoiceStatus !== 'ALL') params.invoiceStatus = invoiceStatus;
      if (search && search.trim()) params.search = search.trim();

      const response = await api.get('/admin/orders', { params });
      if (response.data.success) {
        setOrders(response.data.orders || []);
        if (response.data.stats) {
          setOrderStats(response.data.stats);
        }
      }
    } catch (err) {
      console.warn('[OrderContext] Fetch admin orders:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  // Automatically fetch on auth change
  useEffect(() => {
    if (token) {
      if (isAdmin) {
        fetchAdminOrders();
      } else {
        fetchCustomerOrders();
      }
    } else {
      setOrders([]);
    }
  }, [token, isAdmin, fetchCustomerOrders, fetchAdminOrders]);

  /**
   * Create wholesale order
   */
  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/orders', orderData);
      if (response.data.success) {
        const newOrder = response.data.order;
        setOrders((prev) => [newOrder, ...prev]);
        return { success: true, order: newOrder };
      }
      return { success: false, error: response.data.message || 'Failed to create order.' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get single order by ID or orderNumber
   */
  const getOrderById = async (id) => {
    // Check cached state first
    const cached = orders.find(
      (o) => o._id === id || o.id === id || o.orderNumber === id || o.orderNumber === id?.toUpperCase()
    );

    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data.success && response.data.order) {
        const liveOrder = response.data.order;
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o._id === liveOrder._id || o.orderNumber === liveOrder.orderNumber);
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
      console.warn('[OrderContext] Live fetch single order failed, falling back to cache:', err.message);
    }

    return cached || null;
  };

  /**
   * Fetch invoice for an order (Guard: Only paid orders return invoice)
   */
  const getOrderInvoice = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`);
      if (response.data.success) {
        return { success: true, invoice: response.data.invoice };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invoice is not available for this order.';
      return { success: false, error: msg };
    }
  };

  /**
   * Update order status (Admin)
   */
  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        ...extraData,
      });
      if (response.data.success) {
        const updated = response.data.order;
        setOrders((prev) =>
          prev.map((o) => (o._id === updated._id || o.orderNumber === updated.orderNumber ? updated : o))
        );
        return { success: true, order: updated };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update order status.';
      return { success: false, error: msg };
    }
  };

  /**
   * Confirm manual payment received (Admin)
   */
  const confirmPayment = async (orderId, paymentData = {}) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/payment`, paymentData);
      if (response.data.success) {
        const updated = response.data.order;
        const invoice = response.data.invoice;
        setOrders((prev) =>
          prev.map((o) => (o._id === updated._id || o.orderNumber === updated.orderNumber ? updated : o))
        );
        return { success: true, order: updated, invoice };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to confirm payment.';
      return { success: false, error: msg };
    }
  };

  /**
   * Update invoice / bill details (Admin)
   */
  const updateInvoice = async (invoiceOrOrderId, updatedData = {}) => {
    try {
      const response = await api.put(`/admin/invoices/${invoiceOrOrderId}`, updatedData);
      if (response.data.success) {
        const updatedInvoice = response.data.invoice;
        const updatedOrder = response.data.order;
        if (updatedOrder) {
          setOrders((prev) =>
            prev.map((o) =>
              o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o
            )
          );
        }
        return { success: true, invoice: updatedInvoice, order: updatedOrder };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      // Fallback try orders endpoint if invoices endpoint failed
      try {
        const fallbackRes = await api.put(`/orders/${invoiceOrOrderId}/invoice`, updatedData);
        if (fallbackRes.data.success) {
          const updatedInvoice = fallbackRes.data.invoice;
          const updatedOrder = fallbackRes.data.order;
          if (updatedOrder) {
            setOrders((prev) =>
              prev.map((o) =>
                o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o
              )
            );
          }
          return { success: true, invoice: updatedInvoice, order: updatedOrder };
        }
      } catch (fbErr) {}

      const msg = err.response?.data?.message || err.message || 'Failed to update bill details.';
      return { success: false, error: msg };
    }
  };

  /**
   * Fetch all invoices (Admin)
   */
  const fetchAdminInvoices = async () => {
    try {
      const response = await api.get('/admin/invoices');
      if (response.data.success) {
        return { success: true, invoices: response.data.invoices || [] };
      }
      return { success: false, invoices: [] };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message, invoices: [] };
    }
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
