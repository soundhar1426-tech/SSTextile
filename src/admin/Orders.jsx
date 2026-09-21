import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useOrders, deduplicateOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';
import { playNewOrderSound, requestNotificationPermission, showDesktopNotification } from '../utils/soundAlert';

export const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    orders,
    orderStats,
    fetchAdminOrders,
    updateOrderStatus,
    confirmPayment,
    verifyAndConfirmBill,
    updateInvoice,
    soundEnabled,
    setSoundEnabled,
    playTestSound,
    loading,
  } = useOrders();

  const { millSettings } = useProducts();
  const currentMill = millSettings || millInfo;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [filterInvoice, setFilterInvoice] = useState('ALL');

  // Active Modals State
  const [selectedOrderForBillCheck, setSelectedOrderForBillCheck] = useState(null);
  const [billCheckForm, setBillCheckForm] = useState(null);
  const [isConfirmingBill, setIsConfirmingBill] = useState(false);

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const prevOrdersCountRef = useRef(null);

  // Strictly deduplicated list of orders
  const uniqueOrders = useMemo(() => {
    return deduplicateOrders(orders || []);
  }, [orders]);

  // Fetch admin orders with active filters & search
  useEffect(() => {
    fetchAdminOrders(filterStatus, filterPayment, filterInvoice, searchQuery);
    requestNotificationPermission();

    const interval = setInterval(() => {
      fetchAdminOrders(filterStatus, filterPayment, filterInvoice, searchQuery);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchAdminOrders, filterStatus, filterPayment, filterInvoice, searchQuery]);

  // Handle URL query parameter `?checkOrder=...` to automatically open Bill Verification modal
  useEffect(() => {
    const checkOrderParam = searchParams.get('checkOrder');
    if (checkOrderParam && uniqueOrders.length > 0) {
      const target = uniqueOrders.find(
        (o) =>
          o._id === checkOrderParam ||
          o.id === checkOrderParam ||
          o.orderNumber === checkOrderParam ||
          o.orderNumber?.toUpperCase() === checkOrderParam.toUpperCase()
      );
      if (target) {
        handleOpenBillCheckModal(target);
        // Clean URL parameter
        searchParams.delete('checkOrder');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, uniqueOrders]);

  // Detect new incoming order for audio chime
  useEffect(() => {
    if (uniqueOrders && uniqueOrders.length > 0) {
      if (prevOrdersCountRef.current !== null && uniqueOrders.length > prevOrdersCountRef.current) {
        const latestOrder = uniqueOrders[0];
        if (soundEnabled) {
          playNewOrderSound();
        }
        showDesktopNotification(
          '🚨 New Wholesale Order Received!',
          `Order #${latestOrder.orderNumber || latestOrder.id} received for ₹${Number(latestOrder.totalAmount || latestOrder.total || 0).toLocaleString('en-IN')}`
        );
        setNewOrderAlert(latestOrder);
      }
      prevOrdersCountRef.current = uniqueOrders.length;
    } else if (uniqueOrders) {
      prevOrdersCountRef.current = uniqueOrders.length;
    }
  }, [uniqueOrders, soundEnabled]);

  // Open Bill Verification & Confirmation Modal
  const handleOpenBillCheckModal = (order, e) => {
    if (e) e.stopPropagation();
    setSelectedOrderForBillCheck(order);

    const items = (order.items || []).map((item, idx) => ({
      key: item._id || item.id || `item-${idx}`,
      _id: item._id,
      id: item.id,
      productName: item.productName || item.productTitle || 'White Terry Towel',
      size: item.size || '30x60',
      hsnCode: item.hsnCode || '6302.60',
      quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
      price: Math.max(0, Number(item.price) || 0),
      subtotal: (Math.max(0, parseInt(item.quantity, 10) || 0)) * (Math.max(0, Number(item.price) || 0)),
    }));

    const calculatedSubtotal = items.reduce((sum, it) => sum + it.subtotal, 0) || Number(order.subtotal || order.totalAmount || 0);
    const calculatedDiscount = Number(order.discount || 0);
    const taxable = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const calculatedTax = Number(order.tax !== undefined ? order.tax : Math.round(taxable * 0.05));
    const calculatedTotal = taxable + calculatedTax;

    setBillCheckForm({
      orderNumber: order.orderNumber || order.id,
      customerName: order.customerDetails?.name || order.customer?.name || order.shippingAddress?.name || 'Customer',
      businessName: order.customerDetails?.businessName || order.customer?.businessName || '',
      phone: order.customerDetails?.phone || order.customer?.phone || order.shippingAddress?.phone || '',
      email: order.customerDetails?.email || order.customer?.email || '',
      gstin: order.customerDetails?.gstin || order.shippingAddress?.gstin || '',
      address: order.deliveryDetails?.addressLine1 || order.shippingAddress?.address || '',
      city: order.deliveryDetails?.city || order.shippingAddress?.city || 'Erode',
      state: order.deliveryDetails?.state || order.shippingAddress?.state || 'Tamil Nadu',
      stateCode: order.deliveryDetails?.stateCode || order.buyerStateCode || '33',
      transporter: order.deliveryDetails?.transporter || 'VRL Logistics Cargo',
      vehicleNo: order.deliveryDetails?.vehicleNo || 'TN 33 AB 1234',
      items: items.length > 0 ? items : [{
        key: 'item-0',
        productName: 'White Towel Consignment',
        size: 'Standard',
        hsnCode: '6302.60',
        quantity: order.totalPieces || 50,
        price: 150,
        subtotal: calculatedSubtotal,
      }],
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      tax: calculatedTax,
      totalAmount: calculatedTotal,
      paymentMethod: order.paymentDetails?.paymentMethod || order.paymentMethod || 'UPI',
      paymentReference: order.paymentDetails?.paymentReference || '',
    });
  };

  // Line item change inside the Bill Verification Modal
  const handleBillItemChange = (index, field, value) => {
    setBillCheckForm((prev) => {
      const items = [...prev.items];
      const target = { ...items[index] };
      if (field === 'quantity') {
        target.quantity = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      } else if (field === 'price') {
        target.price = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      } else {
        target[field] = value;
      }
      const q = parseInt(target.quantity, 10) || 0;
      const p = parseFloat(target.price) || 0;
      target.subtotal = q * p;
      items[index] = target;

      const sub = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
      const disc = Number(prev.discount || 0);
      const tax = Math.round(Math.max(0, sub - disc) * 0.05);
      const tot = Math.max(0, sub - disc) + tax;

      return {
        ...prev,
        items,
        subtotal: sub,
        tax,
        totalAmount: tot,
      };
    });
  };

  // Handle Confirming the Bill & Generating the GST Tax Invoice
  const handleConfirmBillAndGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedOrderForBillCheck || !billCheckForm) return;

    setIsConfirmingBill(true);
    const orderId = selectedOrderForBillCheck._id || selectedOrderForBillCheck.id || selectedOrderForBillCheck.orderNumber;

    const payload = {
      ...billCheckForm,
      isCustomized: true,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      total: billCheckForm.totalAmount,
    };

    const res = await verifyAndConfirmBill(orderId, payload);
    setIsConfirmingBill(false);

    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `✓ Bill verified and confirmed for Order #${selectedOrderForBillCheck.orderNumber || orderId}! Final GST Tax Invoice ${res.invoice?.invoiceNumber || ''} generated & delivered to Buyer Portal.`,
      });
      setSelectedOrderForBillCheck(null);
      setBillCheckForm(null);
      fetchAdminOrders(filterStatus, filterPayment, filterInvoice, searchQuery);
      setTimeout(() => setFeedbackMessage(null), 6000);
    } else {
      alert(`Error confirming bill: ${res.error || 'Failed to confirm bill'}`);
    }
  };

  // Handle changing order status
  const handleStatusChange = async (orderId, newStatus, e) => {
    if (e) e.stopPropagation();
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Order status updated to "${newStatus}".`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      alert(`Failed to update status: ${res.error}`);
    }
  };

  // Compute stats fallback
  const computedStats = orderStats || {
    totalOrders: uniqueOrders.length,
    newOrders: uniqueOrders.filter(o => (o.orderStatus || '').toLowerCase() === 'new').length,
    pendingPayments: uniqueOrders.filter(o => (o.paymentStatus || '').toLowerCase() === 'pending').length,
    paidOrders: uniqueOrders.filter(o => (o.paymentStatus || '').toLowerCase() === 'paid').length,
    processingOrders: uniqueOrders.filter(o => ['processing', 'confirmed'].includes((o.orderStatus || '').toLowerCase())).length,
    deliveredOrders: uniqueOrders.filter(o => (o.orderStatus || '').toLowerCase() === 'delivered').length,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Heading & Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-sm font-bold text-primary">Wholesale Purchase Orders</h1>
          <p className="text-body-sm text-on-surface-variant">
            Check placed bills, verify payments, generate official GST invoices, and update consignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playTestSound();
            }}
            className={`px-3 py-1.5 rounded-lg border text-label-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-[#E6F5F0] border-secondary-fixed text-secondary'
                : 'bg-surface-container border-outline-variant text-on-surface-variant'
            }`}
            title="Toggle audible chime when new orders are placed"
          >
            <span className="material-symbols-outlined text-base">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span>{soundEnabled ? 'Sound: ON' : 'Sound: Muted'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Order Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
          </div>
          <div className="text-headline-sm font-bold text-primary font-mono">{computedStats.totalOrders || 0}</div>
        </div>

        {/* New Orders */}
        <div className="bg-[#FFF9F2] p-3.5 rounded-xl border border-[#FFE2B3] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#B76E00]">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Orders</span>
            <span className="material-symbols-outlined text-lg">fiber_new</span>
          </div>
          <div className="text-headline-sm font-bold text-[#B76E00] font-mono">{computedStats.newOrders || 0}</div>
        </div>

        {/* Pending Payments */}
        <div className="bg-[#FFF4E5] p-3.5 rounded-xl border border-[#FFE2B3] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8C5300]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Pay</span>
            <span className="material-symbols-outlined text-lg">pending</span>
          </div>
          <div className="text-headline-sm font-bold text-[#8C5300] font-mono">{computedStats.pendingPayments || 0}</div>
        </div>

        {/* Paid Orders */}
        <div className="bg-[#E6F5F0] p-3.5 rounded-xl border border-secondary-fixed shadow-xs space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[11px] font-bold uppercase tracking-wider">Paid / Invoiced</span>
            <span className="material-symbols-outlined text-lg">verified</span>
          </div>
          <div className="text-headline-sm font-bold text-secondary font-mono">{computedStats.paidOrders || 0}</div>
        </div>

        {/* Processing Orders */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">Processing</span>
            <span className="material-symbols-outlined text-lg text-primary">local_shipping</span>
          </div>
          <div className="text-headline-sm font-bold text-primary font-mono">{computedStats.processingOrders || 0}</div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
            <span className="material-symbols-outlined text-lg text-primary">inventory</span>
          </div>
          <div className="text-headline-sm font-bold text-primary font-mono">{computedStats.deliveredOrders || 0}</div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Customer Name, Business, or Phone..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-9 pr-8 py-2 text-body-sm text-primary placeholder:text-on-surface-variant/60 outline-none focus:border-primary font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Order Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-label-sm text-primary font-semibold outline-none focus:border-primary"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="new">New Placed Orders</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready_for_dispatch">Ready for Dispatch</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-label-sm text-primary font-semibold outline-none focus:border-primary"
          >
            <option value="ALL">All Payments</option>
            <option value="pending">Payment: Pending Verification</option>
            <option value="paid">Payment: Paid &amp; Confirmed</option>
          </select>

          {/* Invoice Status */}
          <select
            value={filterInvoice}
            onChange={(e) => setFilterInvoice(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-label-sm text-primary font-semibold outline-none focus:border-primary"
          >
            <option value="ALL">All Invoices</option>
            <option value="generated">Invoice: Generated</option>
            <option value="not_generated">Invoice: Pending</option>
          </select>

          {/* Clear Filters button */}
          {(filterStatus !== 'ALL' || filterPayment !== 'ALL' || filterInvoice !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPayment('ALL');
                setFilterInvoice('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary text-label-sm font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-body-sm font-medium animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-[#E6F5F0] border-secondary-fixed text-secondary'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Orders Table & List */}
      {loading ? (
        <div className="py-12 text-center text-on-surface-variant">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-body-sm">Loading wholesale orders...</p>
        </div>
      ) : uniqueOrders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-outline">order_approve</span>
          <h3 className="text-title-md font-bold text-primary">No wholesale orders found</h3>
          <p className="text-body-sm text-on-surface-variant">
            No orders match the selected search query and filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {uniqueOrders.map((order) => {
            const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
            const orderNum = order.orderNumber || order.id || `GTX-${order._id?.slice(-5)}`;
            const total = order.totalAmount || order.total || order.subtotal || 0;
            const currentStatus = order.orderStatus || order.status || 'new';

            return (
              <article
                key={order._id || order.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all"
              >
                {/* Top Details Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-primary text-title-md">
                        #{orderNum}
                      </span>
                      <span className="bg-surface-container px-2 py-0.5 rounded text-xs text-on-surface-variant font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="text-xs text-primary underline font-bold hover:text-secondary cursor-pointer"
                      >
                        [View Full Order Info]
                      </button>
                    </div>

                    <h3 className="font-bold text-primary text-body-md mt-1">
                      {order.customerDetails?.businessName || order.customer?.name || order.customerDetails?.name || 'Customer'}
                    </h3>
                    <div className="text-xs text-on-surface-variant space-x-2">
                      <span>Contact: {order.customerDetails?.phone || order.customer?.phone || 'N/A'}</span>
                      <span>•</span>
                      <span>Email: {order.customerDetails?.email || order.customer?.email || 'N/A'}</span>
                      {order.customerDetails?.gstin && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-semibold text-primary">
                            GSTIN: {order.customerDetails.gstin}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Order Status Dropdown */}
                    <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1">
                      <span className="text-xs text-outline font-bold">STATUS:</span>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(order._id || order.id, e.target.value, e)}
                        className="bg-transparent text-label-sm font-bold text-primary outline-none capitalize cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Primary Bill Verification & Payment Confirmation Button */}
                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={(e) => handleOpenBillCheckModal(order, e)}
                        className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/90 text-white text-label-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        title="Admin: Check the bill, verify details, and confirm payment & invoice"
                      >
                        <span className="material-symbols-outlined text-sm">fact_check</span>
                        <span>Check Bill &amp; Confirm</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-bold bg-[#E6F5F0] text-secondary border border-secondary-fixed">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Paid ({order.invoiceNumber || 'Invoiced'})</span>
                      </span>
                    )}

                    {/* View / Edit GST Bill Link */}
                    <Link
                      to={`/invoice/${order._id || orderNum}`}
                      className="px-3 py-1.5 bg-primary-container hover:bg-primary text-white text-label-sm font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                      title="View or edit official tax bill"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      <span>{isPaid ? 'View / Edit Bill' : 'Edit Bill Draft'}</span>
                    </Link>
                  </div>
                </div>

                {/* Items & Shipping Breakdown */}
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <div>
                    <span className="text-label-sm text-outline font-bold uppercase block mb-1">
                      Ordered Products &amp; Sizes:
                    </span>
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="text-primary font-medium flex justify-between pr-4">
                          <span>
                            {item.quantity} pcs × {item.size} ({item.productName || item.productTitle || 'Towel'})
                          </span>
                          <span className="font-mono font-semibold">
                            ₹{(item.subtotal || item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l sm:pl-4 border-surface-container pt-2 sm:pt-0">
                    <span className="text-label-sm text-outline font-bold uppercase block mb-1">
                      Consignment &amp; Settlement:
                    </span>
                    <p className="text-primary font-medium">
                      Carrier: {order.deliveryDetails?.transporter || 'VRL Logistics Cargo'}
                    </p>
                    <p className="text-on-surface-variant text-xs">
                      Destination: {order.deliveryDetails?.city || order.shippingAddress?.city || 'Erode'}, {order.deliveryDetails?.state || 'Tamil Nadu'}
                    </p>
                    <p className="font-mono font-bold text-primary text-title-md mt-1">
                      Grand Total: ₹{total.toLocaleString('en-IN')}.00
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Comprehensive Bill Verification & Confirmation Modal */}
      {selectedOrderForBillCheck && billCheckForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 max-w-3xl w-full shadow-2xl space-y-5 my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-surface-container">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">fact_check</span>
                  <h3 className="text-title-lg font-bold text-primary">
                    Check Bill &amp; Confirm Order #{billCheckForm.orderNumber}
                  </h3>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Inspect buyer consignment details, verify prices/quantities, and confirm payment to issue the final GST Tax Invoice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForBillCheck(null);
                  setBillCheckForm(null);
                }}
                className="p-1 text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmBillAndGenerateInvoice} className="space-y-4">
              {/* Buyer & Consignment Info Banner */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                <div>
                  <span className="text-[11px] font-bold text-outline uppercase block mb-0.5">Buyer / Consignee:</span>
                  <p className="font-bold text-primary">{billCheckForm.businessName || billCheckForm.customerName}</p>
                  <p className="text-xs text-on-surface-variant">Phone: {billCheckForm.phone} • Email: {billCheckForm.email}</p>
                  <p className="text-xs text-on-surface-variant">
                    GSTIN: <span className="font-mono font-bold text-primary">{billCheckForm.gstin || 'Unregistered'}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-outline uppercase block mb-0.5">Logistics &amp; Destination:</span>
                  <p className="text-xs text-primary font-medium">{billCheckForm.address}, {billCheckForm.city}, {billCheckForm.state}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Carrier: <strong className="text-primary">{billCheckForm.transporter}</strong>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Place of Supply: <strong className="text-primary">{billCheckForm.state} ({billCheckForm.stateCode})</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-label-sm font-bold text-outline uppercase">
                    Consignment Items &amp; Rates (Verified for GST Invoice)
                  </span>
                  <span className="text-xs text-secondary font-bold font-mono bg-secondary-fixed/40 px-2 py-0.5 rounded">
                    HSN 6302.60 • 5% GST
                  </span>
                </div>

                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  <table className="w-full text-body-sm text-left">
                    <thead className="bg-surface-container text-label-sm text-primary font-bold">
                      <tr>
                        <th className="p-2.5">Product &amp; Size</th>
                        <th className="p-2.5 text-center">Qty (Pcs)</th>
                        <th className="p-2.5 text-right">Rate (₹)</th>
                        <th className="p-2.5 text-right">Subtotal (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
                      {billCheckForm.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low">
                          <td className="p-2.5">
                            <span className="font-bold text-primary block">{item.productName}</span>
                            <span className="text-xs text-on-surface-variant">Size: {item.size} • HSN: {item.hsnCode}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleBillItemChange(idx, 'quantity', e.target.value)}
                              className="w-20 text-center font-bold bg-surface-container border border-outline-variant rounded px-2 py-1 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleBillItemChange(idx, 'price', e.target.value)}
                              className="w-24 text-right font-bold bg-surface-container border border-outline-variant rounded px-2 py-1 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-primary">
                            ₹{(item.subtotal || item.quantity * item.price).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals Breakdown */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-1.5 text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-medium">₹{Number(billCheckForm.subtotal || 0).toLocaleString('en-IN')}.00</span>
                </div>
                {Number(billCheckForm.discount || 0) > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Wholesale Rebate / Discount:</span>
                    <span className="font-mono font-medium">- ₹{Number(billCheckForm.discount).toLocaleString('en-IN')}.00</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>GST (5% Intra/Inter State):</span>
                  <span className="font-mono font-medium">+ ₹{Number(billCheckForm.tax || 0).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-primary font-bold text-title-md border-t border-surface-container pt-2 mt-1">
                  <span>Grand Total Net Payable:</span>
                  <span className="font-mono text-secondary text-headline-sm">
                    ₹{Number(billCheckForm.totalAmount || 0).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              {/* Payment Settlement Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1 font-semibold">
                    Payment Method Received
                  </label>
                  <select
                    value={billCheckForm.paymentMethod}
                    onChange={(e) => setBillCheckForm({ ...billCheckForm, paymentMethod: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-md text-primary outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                    <option value="Bank Transfer">Bank Transfer (RTGS / NEFT / IMPS)</option>
                    <option value="Cash">Cash (Ex-Mill Settlement)</option>
                    <option value="Other">Other Wholesale Account</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1 font-semibold">
                    Bank Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-982347102938"
                    value={billCheckForm.paymentReference}
                    onChange={(e) => setBillCheckForm({ ...billCheckForm, paymentReference: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-md text-primary font-mono outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Automated Invoicing Guarantee Note */}
              <div className="p-3 bg-[#E6F5F0] rounded-xl border border-secondary-fixed text-xs text-secondary flex items-start gap-2">
                <span className="material-symbols-outlined text-base mt-0.5 shrink-0">verified</span>
                <div>
                  <p className="font-bold">Automated GST Tax Invoice Issuance:</p>
                  <p>
                    Clicking <strong>Confirm Bill &amp; Generate GST Invoice</strong> marks the order as <strong>Confirmed &amp; Paid</strong>, automatically produces the official GST Tax Invoice with SSTextiles details, and makes it instantly accessible in the buyer portal.
                  </p>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  to={`/invoice/${selectedOrderForBillCheck._id || selectedOrderForBillCheck.orderNumber || selectedOrderForBillCheck.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Open Full Invoice Editor</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderForBillCheck(null);
                      setBillCheckForm(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-primary font-bold text-label-md hover:bg-surface-container cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConfirmingBill}
                    className="px-5 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-white font-bold text-label-md shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isConfirmingBill ? (
                      <span>Generating Invoice...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span>✓ Confirm Bill &amp; Generate GST Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Order Details View Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-surface-container">
              <div>
                <h3 className="text-title-lg font-bold text-primary font-mono">
                  Order #{selectedOrderForDetails.orderNumber || selectedOrderForDetails.id}
                </h3>
                <span className="text-xs text-on-surface-variant">
                  Placed on {new Date(selectedOrderForDetails.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="p-1 text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Customer Information */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2">
              <span className="text-label-sm font-bold text-outline uppercase block">Buyer &amp; Account Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm">
                <div>
                  <p className="font-bold text-primary">{selectedOrderForDetails.customerDetails?.name || 'Customer'}</p>
                  <p className="text-xs text-on-surface-variant">{selectedOrderForDetails.customerDetails?.businessName || 'Wholesale Buyer'}</p>
                  <p className="text-xs text-on-surface-variant">Phone: {selectedOrderForDetails.customerDetails?.phone || 'N/A'}</p>
                  <p className="text-xs text-on-surface-variant">Email: {selectedOrderForDetails.customerDetails?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">
                    GSTIN: <span className="font-mono font-bold text-primary">{selectedOrderForDetails.customerDetails?.gstin || 'Unregistered'}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Logistics: <span className="font-medium text-primary">{selectedOrderForDetails.deliveryDetails?.transporter || 'VRL Logistics Cargo'}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Destination: {selectedOrderForDetails.deliveryDetails?.addressLine1 || selectedOrderForDetails.shippingAddress?.address || ''}, {selectedOrderForDetails.deliveryDetails?.city || selectedOrderForDetails.shippingAddress?.city}, {selectedOrderForDetails.deliveryDetails?.state || selectedOrderForDetails.shippingAddress?.state} - {selectedOrderForDetails.deliveryDetails?.pincode || selectedOrderForDetails.shippingAddress?.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <span className="text-label-sm font-bold text-outline uppercase block">Purchased Line Items</span>
              <table className="w-full text-body-sm text-left border border-outline-variant rounded-xl overflow-hidden">
                <thead className="bg-surface-container text-label-sm text-primary font-bold">
                  <tr>
                    <th className="p-2.5">Product &amp; Size</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {selectedOrderForDetails.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low">
                      <td className="p-2.5">
                        <span className="font-bold text-primary">{item.productName || 'White Towel'}</span>
                        <span className="block text-xs text-on-surface-variant">Size: {item.size} cm</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{item.quantity} pcs</td>
                      <td className="p-2.5 text-right font-mono">₹{item.price}</td>
                      <td className="p-2.5 text-right font-mono font-bold">₹{(item.subtotal || item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-1.5 text-body-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal ({selectedOrderForDetails.totalPieces || selectedOrderForDetails.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} pcs):</span>
                <span className="font-mono font-medium">₹{Number(selectedOrderForDetails.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              {Number(selectedOrderForDetails.discount || 0) > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Wholesale Tier Discount:</span>
                  <span className="font-mono font-medium">- ₹{Number(selectedOrderForDetails.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>GST (5%):</span>
                <span className="font-mono font-medium">₹{Number(selectedOrderForDetails.tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-primary font-bold text-title-md border-t border-surface-container pt-2 mt-1">
                <span>Grand Total:</span>
                <span className="font-mono text-secondary">₹{Number(selectedOrderForDetails.totalAmount || selectedOrderForDetails.total || 0).toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-primary font-bold text-label-md hover:bg-surface-container cursor-pointer transition-all"
              >
                Close
              </button>
              {(selectedOrderForDetails.paymentStatus || '').toLowerCase() === 'paid' ? (
                <Link
                  to={`/invoice/${selectedOrderForDetails._id || selectedOrderForDetails.orderNumber}`}
                  className="px-5 py-2 bg-primary-container text-white rounded-lg font-bold text-label-md flex items-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                  <span>View Full Invoice</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderForDetails;
                    setSelectedOrderForDetails(null);
                    handleOpenBillCheckModal(ord);
                  }}
                  className="px-5 py-2 bg-secondary text-white rounded-lg font-bold text-label-md flex items-center gap-1.5 shadow cursor-pointer hover:bg-secondary/90"
                >
                  <span className="material-symbols-outlined text-sm">fact_check</span>
                  <span>Check Bill &amp; Confirm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
