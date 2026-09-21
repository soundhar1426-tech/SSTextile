import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, deduplicateOrders } from '../context/OrderContext';
import { playNewOrderSound, requestNotificationPermission, showDesktopNotification } from '../utils/soundAlert';

export const AdminOrders = () => {
  const { orders, orderStats, fetchAdminOrders, updateOrderStatus, confirmPayment, loading } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [filterInvoice, setFilterInvoice] = useState('ALL');

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchAdminOrders, filterStatus, filterPayment, filterInvoice, searchQuery]);

  // Detect new incoming order for audio and visual notification
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
      prevOrdersCountRef.current = orders.length;
    } else if (orders) {
      prevOrdersCountRef.current = orders.length;
    }
  }, [orders, soundEnabled]);

  // Handle opening payment modal
  const handleOpenPaymentModal = (order, e) => {
    if (e) e.stopPropagation();
    setSelectedOrderForPayment(order);
    setPaymentMethod('UPI');
    setPaymentRef('');
  };

  // Handle confirming offline payment
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;

    setIsProcessingPayment(true);
    const orderId = selectedOrderForPayment._id || selectedOrderForPayment.id;
    const res = await confirmPayment(orderId, {
      paymentMethod,
      paymentReference: paymentRef,
      amount: selectedOrderForPayment.totalAmount || selectedOrderForPayment.total,
    });

    setIsProcessingPayment(false);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `✓ Payment confirmed for Order #${selectedOrderForPayment.orderNumber || orderId}. Final Invoice ${res.invoice?.invoiceNumber || ''} generated!`,
      });
      setSelectedOrderForPayment(null);
      fetchAdminOrders(filterStatus, filterPayment, filterInvoice, searchQuery);
      setTimeout(() => setFeedbackMessage(null), 5000);
    } else {
      alert(`Error: ${res.error || 'Failed to confirm payment'}`);
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

  // Compute stats fallback if not provided by backend stats object
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
            Manage wholesale orders, verify offline payments, update dispatch status, and issue tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playNewOrderSound();
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
            <span className="text-[11px] font-bold uppercase tracking-wider">Paid Orders</span>
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
            <option value="new">New</option>
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
            <option value="pending">Payment: Pending</option>
            <option value="paid">Payment: Paid</option>
          </select>

          {/* Invoice Status */}
          <select
            value={filterInvoice}
            onChange={(e) => setFilterInvoice(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-label-sm text-primary font-semibold outline-none focus:border-primary"
          >
            <option value="ALL">All Invoices</option>
            <option value="generated">Invoice: Generated</option>
            <option value="not_generated">Invoice: Not Generated</option>
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

      {/* New Live Order Alert Flash Banner */}
      {newOrderAlert && (
        <div className="p-4 bg-[#E6F5F0] border-2 border-secondary-fixed rounded-2xl flex items-center justify-between gap-3 shadow-md animate-bounce">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">notifications_active</span>
            </span>
            <div>
              <p className="font-bold text-primary text-body-md">
                🚨 NEW ORDER #{newOrderAlert.orderNumber || newOrderAlert.id} RECEIVED!
              </p>
              <p className="text-xs text-secondary font-semibold">
                Buyer: {newOrderAlert.customerDetails?.businessName || newOrderAlert.customerDetails?.name || 'Customer'} • Total: ₹{Number(newOrderAlert.totalAmount || newOrderAlert.total || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewOrderAlert(null)}
            className="px-3 py-1 bg-secondary text-white rounded-lg text-label-sm font-bold hover:bg-secondary/90 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-body-sm font-medium ${
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

                    {/* Payment Status / Action */}
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-bold bg-[#E6F5F0] text-secondary border border-secondary-fixed">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Paid ({order.invoiceNumber || 'Invoiced'})</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleOpenPaymentModal(order, e)}
                        className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/90 text-white text-label-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">task_alt</span>
                        <span>Confirm Payment Received</span>
                      </button>
                    )}

                    {/* Admin Edit / View Bill Details */}
                    <Link
                      to={`/invoice/${order._id || orderNum}`}
                      className="px-3 py-1.5 bg-primary-container hover:bg-primary text-white text-label-sm font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                      title="Admin: Edit bill details before or after confirming payment"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
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

      {/* Admin Payment Confirmation Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">account_balance_wallet</span>
                <h3 className="font-title-md text-title-md font-bold text-primary">
                  Confirm Payment Received
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-2 text-body-sm">
              <p className="text-primary font-semibold">
                Confirm that payment of{' '}
                <strong className="text-secondary font-mono text-headline-sm">
                  ₹{(selectedOrderForPayment.totalAmount || selectedOrderForPayment.total || 0).toLocaleString('en-IN')}
                </strong>{' '}
                has been received for Order #{selectedOrderForPayment.orderNumber || selectedOrderForPayment.id}?
              </p>
              <p className="text-xs text-on-surface-variant">
                Customer: {selectedOrderForPayment.customerDetails?.name || selectedOrderForPayment.customer?.name} (
                {selectedOrderForPayment.customerDetails?.businessName || 'Wholesale Buyer'})
              </p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1 font-semibold">
                  Payment Method Received
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
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
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-md text-primary font-mono outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-[#E6F5F0] rounded-lg border border-secondary-fixed text-xs text-secondary space-y-2">
                <div>
                  <p className="font-bold">Automated Invoice Generation:</p>
                  <p>
                    Upon confirmation, the order will be marked as <strong>PAID</strong> and a <strong>Final GST Tax Invoice</strong> will be issued to the buyer.
                  </p>
                </div>
                <div className="pt-1.5 border-t border-secondary-fixed/50 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-on-surface-variant">Need to edit buyer or HSN details first?</span>
                  <Link
                    to={`/invoice/${selectedOrderForPayment._id || selectedOrderForPayment.orderNumber || selectedOrderForPayment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <span>Edit Bill Details</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-primary font-bold text-label-md hover:bg-surface-container cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-white font-bold text-label-md shadow flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <span>Confirming...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Confirm Payment</span>
                    </>
                  )}
                </button>
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
                    handleOpenPaymentModal(ord);
                  }}
                  className="px-5 py-2 bg-secondary text-white rounded-lg font-bold text-label-md flex items-center gap-1.5 shadow cursor-pointer hover:bg-secondary/90"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  <span>Confirm Payment</span>
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
