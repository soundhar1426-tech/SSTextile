import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';

export const Orders = () => {
  const { orders, fetchCustomerOrders, loading } = useOrders();
  const [filterTab, setFilterTab] = useState('ALL');

  useEffect(() => {
    fetchCustomerOrders();

    // Auto-poll every 5 seconds so buyer sees status and invoice updates in real-time
    const interval = setInterval(() => {
      fetchCustomerOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCustomerOrders]);

  const filteredOrders = orders.filter((order) => {
    const status = (order.orderStatus || order.status || '').toLowerCase();
    const payment = (order.paymentStatus || '').toLowerCase();

    if (filterTab === 'ALL') return true;
    if (filterTab === 'PENDING') return payment === 'pending' || status === 'new';
    if (filterTab === 'PAID') return payment === 'paid' || status === 'confirmed';
    if (filterTab === 'PROCESSING') return status === 'processing' || status === 'confirmed' || status === 'ready_for_dispatch';
    if (filterTab === 'DELIVERED') return status === 'delivered';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Page Title & Micro Meta */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider font-bold">
            CUSTOMER PORTAL
          </span>
          <span className="text-label-sm font-label-sm text-on-surface-variant flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-1">verified_user</span>
            B2B Verified Account
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-headline-lg-mobile md:text-headline-md font-bold text-primary tracking-tight">
            My Wholesale Orders &amp; Invoices
          </h1>
          <button
            onClick={() => fetchCustomerOrders()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded-lg text-label-sm font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            title="Refresh order statuses from mill server"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh Status</span>
          </button>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          View your wholesale order progress, bill confirmation status, and printable GST tax invoices.
        </p>
      </section>

      {/* Filter Tabs */}
      <section className="overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
        <div className="flex space-x-2 w-max">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors cursor-pointer ${filterTab === 'ALL'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span>All Orders</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-primary text-[10px] font-bold">
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors cursor-pointer ${filterTab === 'PENDING'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span>Pending Verification</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant text-[10px] font-bold">
              {orders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('PAID')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors cursor-pointer ${filterTab === 'PAID'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span>Confirmed &amp; Invoiced</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant text-[10px] font-bold">
              {orders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'paid').length}
            </span>
          </button>
        </div>
      </section>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-body-sm">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline">receipt_long</span>
          <h3 className="text-title-md font-bold text-primary">No orders found</h3>
          <p className="text-body-sm text-on-surface-variant">
            {filterTab === 'ALL'
              ? "You haven't placed any wholesale orders yet."
              : `No orders matching filter: ${filterTab}.`}
          </p>
          <Link
            to="/products"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg font-bold text-label-md mt-2 shadow"
          >
            Browse Towel Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
            const orderNum = order.orderNumber || order.id || `GTX-${order._id?.slice(-5)}`;
            const total = order.totalAmount || order.total || order.subtotal || 0;
            const orderStatus = order.orderStatus || order.status || 'new';

            return (
              <article
                key={order._id || order.id}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-title-md font-bold text-primary font-mono">
                        #{orderNum}
                      </span>
                      <span className="text-xs text-on-surface-variant px-2 py-0.5 rounded bg-surface-container">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-body-sm font-semibold text-primary mt-1">
                      {order.customerDetails?.businessName || order.customerDetails?.name || order.shippingAddress?.name || 'Wholesale Buyer'}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Order Status Badge */}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-label-sm font-bold bg-surface-container border border-outline-variant text-primary capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                      {orderStatus}
                    </span>

                    {/* Payment Status Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-label-sm font-bold border ${isPaid
                        ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                        : 'bg-[#FFF4E5] text-[#B76E00] border-[#FFE2B3]'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPaid ? 'bg-secondary' : 'bg-[#B76E00] pulse-live'
                          }`}
                      ></span>
                      {isPaid ? '✓ Confirmed & Paid' : 'Payment Pending Verification'}
                    </span>

                    {/* Invoice Status Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-label-sm font-bold border ${isPaid
                        ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[15px] mr-1">
                        {isPaid ? 'receipt' : 'schedule'}
                      </span>
                      {isPaid ? '✓ GST Invoice Generated' : 'Bill Pending Confirmation'}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant space-y-1.5">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant font-medium">Consignment Items:</span>
                    <span className="font-bold text-primary font-mono">
                      {order.totalPieces || order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} pcs total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-surface-container text-label-sm text-on-surface-variant">
                    {order.items?.map((item, idx) => (
                      <span key={idx} className="flex items-center">
                        <span className="material-symbols-outlined text-[15px] mr-1 text-on-surface-variant">
                          straighten
                        </span>
                        {item.quantity} pcs • {item.size} ({item.productName || item.productTitle || 'Towel'})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Logistics & Value info */}
                <div className="flex flex-wrap items-center justify-between text-body-sm gap-2 pt-1">
                  <div>
                    <span className="text-label-sm text-on-surface-variant block font-bold uppercase">
                      Total Order Value
                    </span>
                    <span className="text-title-md font-bold text-primary font-mono">
                      ₹{total.toLocaleString('en-IN')}.00
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">
                      Inclusive of 5% GST
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-label-sm text-on-surface-variant block font-bold uppercase">
                      Invoice Status
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-label-md font-bold text-secondary">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Official GST Invoice Generated {order.invoiceNumber ? `(${order.invoiceNumber})` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-[#B76E00] font-semibold">
                        Bill Under Admin Verification
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-surface-container flex flex-wrap items-center gap-2">
                  <Link
                    to={`/orders/${order._id || orderNum}`}
                    className="flex-1 py-2 px-3 rounded-lg border border-primary text-primary font-label-md font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container active:scale-95 transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>View Order Details</span>
                  </Link>

                  {isPaid ? (
                    <Link
                      to={`/invoice/${order._id || orderNum}`}
                      className="py-2 px-4 rounded-lg bg-primary-container hover:bg-primary text-white font-label-md font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      <span>View / Download GST Invoice</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/invoice/${order._id || orderNum}`}
                      className="py-2 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant font-label-md font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                      <span>{order.invoice ? 'View Proforma Bill' : 'View Bill (Pending Confirmation)'}</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
