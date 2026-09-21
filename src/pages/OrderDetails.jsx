import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';

export const OrderDetails = () => {
  const { id } = useParams();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrder = async (isManual = false) => {
    if (!id) return;
    if (isManual) setIsRefreshing(true);
    const data = await getOrderById(id);
    if (data) {
      setOrder(data);
    }
    setLoading(false);
    if (isManual) setIsRefreshing(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id, getOrderById]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-body-sm text-on-surface-variant">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-title-md font-bold text-primary">Order Not Found</h2>
        <p className="text-body-sm text-on-surface-variant">
          We couldn't locate the order details requested.
        </p>
        <Link to="/orders" className="text-secondary font-bold underline block mt-2">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
  const orderNum = order.orderNumber || order.id || `GTX-${order._id?.slice(-5)}`;
  const orderStatus = order.orderStatus || order.status || 'new';
  const total = order.totalAmount || order.total || order.subtotal || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/orders" className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-headline-sm font-bold text-primary font-mono">
              Order #{orderNum}
            </h1>
          </div>
          <span className="text-body-sm text-on-surface-variant block mt-0.5">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              dateStyle: 'long',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrder(true)}
            disabled={isRefreshing}
            className="p-2 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded-lg text-label-sm font-bold active:scale-95 transition-all cursor-pointer"
            title="Refresh order status"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
          </button>

          {isPaid ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-label-sm font-bold bg-[#E6F5F0] text-secondary border border-secondary-fixed">
                <span className="material-symbols-outlined text-sm mr-1">receipt</span>
                Invoice Generated
              </span>
              <Link
                to={`/invoice/${order._id || orderNum}`}
                className="px-4 py-2 bg-primary-container text-white rounded-lg font-label-md font-bold hover:bg-primary flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>View Tax Invoice</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-label-sm font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
                Invoice Pending Payment
              </span>
              <Link
                to={`/invoice/${order._id || orderNum}`}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded-lg font-label-md font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                <span>{order.invoice ? 'View Proforma Bill' : 'View Bill'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Status & Payment Banner */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isPaid ? 'bg-secondary' : 'bg-[#B76E00] pulse-live'
              }`}
            ></span>
            <span className="text-title-md font-bold text-primary capitalize">
              Order Status: {orderStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-lg text-label-md font-bold border ${
                isPaid
                  ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                  : 'bg-[#FFF4E5] text-[#B76E00] border-[#FFE2B3]'
              }`}
            >
              {isPaid ? '✓ Payment Confirmed (Paid)' : 'Payment Status: Pending Verification'}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-lg text-label-md font-bold border ${
                isPaid
                  ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm mr-1">
                {isPaid ? 'receipt' : 'schedule'}
              </span>
              {isPaid ? 'Invoice Generated' : 'Invoice Pending'}
            </span>
          </div>
        </div>

        {/* Invoice Notice if Pending / Generated */}
        {!isPaid ? (
          <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#FFE2B3] flex flex-wrap items-center justify-between gap-3 text-body-sm text-[#8C5300]">
            <div className="flex items-start gap-2.5 max-w-xl">
              <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">info</span>
              <div>
                <p className="font-bold">Official Bill &amp; Payment Details</p>
                <p>
                  Review the official bill details and bank account information. Once payment is received and confirmed by our mill admin, your final GST tax invoice will be generated.
                </p>
              </div>
            </div>
            <Link
              to={`/invoice/${order._id || orderNum}`}
              className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-label-sm hover:bg-primary/90 shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>{order.invoice ? 'View Proforma Bill' : 'View Bill'}</span>
            </Link>
          </div>
        ) : (
          <div className="p-4 bg-[#E6F5F0] rounded-xl border border-secondary-fixed flex flex-wrap items-center justify-between gap-3 text-body-sm text-secondary">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-2xl text-secondary">verified</span>
              <div>
                <p className="font-bold text-body-md text-primary">Order #{orderNum} • Payment Verified &amp; Confirmed</p>
                <p className="text-xs text-secondary font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-sm">receipt</span>
                  <span>Invoice Status: <strong>Invoice Generated</strong> {order.invoiceNumber ? `(${order.invoiceNumber})` : ''}</span>
                </p>
              </div>
            </div>
            <Link
              to={`/invoice/${order._id || orderNum}`}
              className="px-4 py-2 bg-primary-container text-white rounded-lg font-bold text-label-sm hover:bg-primary shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>View / Download Invoice</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-border-subtle text-body-sm">
          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Surface Carrier</span>
            <span className="font-semibold text-primary">
              {order.deliveryDetails?.transporter || order.transporter || 'VRL Logistics Cargo'}
            </span>
          </div>
          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Total Pieces</span>
            <span className="font-semibold text-primary font-mono">
              {order.totalPieces || order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} PCS
            </span>
          </div>
          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Payment Method</span>
            <span className="font-semibold text-primary">
              {order.paymentDetails?.paymentMethod || order.paymentMethod || 'UPI / Bank Transfer'}
            </span>
          </div>
          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Invoice Status</span>
            {isPaid ? (
              <span className="font-bold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Invoice Generated
              </span>
            ) : (
              <span className="font-semibold text-[#B76E00]">
                Pending Verification
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Lines */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h2 className="text-title-md font-bold text-primary">Itemized Towel Consignment</h2>
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant font-mono">
            {order.items?.length || 0} ITEM(S)
          </span>
        </div>

        <div className="divide-y divide-border-subtle">
          {order.items?.map((item, idx) => {
            const lineSubtotal = item.subtotal || item.price * item.quantity;
            return (
              <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-primary text-body-md">
                    {item.productName || item.productTitle || 'White Towel Premium'}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Dimension / Size: <span className="font-semibold text-primary font-mono">{item.size}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary text-title-md font-mono">
                    ₹{lineSubtotal.toLocaleString('en-IN')}.00
                  </span>
                  <span className="text-label-sm text-on-surface-variant block">
                    ₹{item.price} × {item.quantity} pcs
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice Totals Breakdown */}
        <div className="p-5 bg-surface-container-low border-t border-outline-variant space-y-2 text-body-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Gross Subtotal:</span>
            <span className="font-mono font-semibold">₹{order.subtotal?.toLocaleString('en-IN')}.00</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-secondary font-semibold">
              <span>Wholesale Volume Rebate:</span>
              <span className="font-mono">-₹{order.discount?.toLocaleString('en-IN')}.00</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Taxable Value:</span>
            <span className="font-mono font-semibold">
              ₹{((order.subtotal || 0) - (order.discount || 0)).toLocaleString('en-IN')}.00
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">GST 5%:</span>
            <span className="font-mono font-semibold">+₹{(order.tax || 0).toLocaleString('en-IN')}.00</span>
          </div>
          <div className="pt-3 border-t border-outline-variant flex justify-between items-baseline font-bold text-title-md text-primary">
            <span>Grand Total:</span>
            <span className="font-mono text-headline-sm">₹{total.toLocaleString('en-IN')}.00</span>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Profile */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-1.5 text-body-sm">
          <span className="text-label-sm font-bold text-outline uppercase block">Customer / Buyer</span>
          <p className="font-bold text-primary text-body-md">
            {order.customerDetails?.name || order.shippingAddress?.name || 'Customer'}
          </p>
          {order.customerDetails?.businessName && (
            <p className="text-on-surface-variant font-medium">{order.customerDetails.businessName}</p>
          )}
          <p className="text-on-surface-variant">Phone: {order.customerDetails?.phone || order.shippingAddress?.phone}</p>
          {order.customerDetails?.email && <p className="text-on-surface-variant">Email: {order.customerDetails.email}</p>}
          {order.customerDetails?.gstin && (
            <p className="font-mono font-semibold text-primary">GSTIN: {order.customerDetails.gstin}</p>
          )}
        </div>

        {/* Delivery Address */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-1.5 text-body-sm">
          <span className="text-label-sm font-bold text-outline uppercase block">Consignee Delivery Address</span>
          <p className="text-primary font-medium">
            {order.deliveryDetails?.addressLine1 || order.shippingAddress?.address}
            {order.deliveryDetails?.addressLine2 ? `, ${order.deliveryDetails.addressLine2}` : ''}
          </p>
          <p className="text-on-surface-variant">
            {order.deliveryDetails?.city || order.shippingAddress?.city}, {order.deliveryDetails?.state || order.shippingAddress?.state} - {order.deliveryDetails?.pincode || order.shippingAddress?.pincode}
          </p>
          <p className="text-on-surface-variant">
            Contact: {order.deliveryDetails?.contactPhone || order.shippingAddress?.phone}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
