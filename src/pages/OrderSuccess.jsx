import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';

export const OrderSuccess = () => {
  const { id } = useParams();
  const { getOrderById } = useOrders();
  const { millSettings } = useProducts();
  const currentMill = millSettings || millInfo;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        const data = await getOrderById(id);
        if (data) {
          setOrder(data);
        }
      }
      setLoading(false);
    };
    fetchOrder();

    const timer = setTimeout(() => setShowToast(false), 6000);
    return () => clearTimeout(timer);
  }, [id, getOrderById]);

  const displayOrderNumber = order?.orderNumber || (id?.startsWith('GTX-') ? id : `GTX-${id}`);
  const orderStatus = order?.orderStatus || 'new';
  const paymentStatus = order?.paymentStatus || 'pending';

  if (loading && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Loading wholesale order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 pb-24">
      {/* Pop Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-primary text-white p-4 rounded-xl shadow-xl flex items-start gap-3 border border-outline-variant animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-label-md">Order Placed Successfully!</h4>
            <p className="text-body-sm text-surface-container-high opacity-90">
              Wholesale Order #{displayOrderNumber} has been logged in the mill database.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-surface-container-high hover:text-white p-1 cursor-pointer"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Success Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-[#E6F5F0] text-secondary rounded-full flex items-center justify-center mx-auto border-2 border-secondary-fixed">
          <span className="material-symbols-outlined text-4xl material-symbols-filled">check_circle</span>
        </div>

        <div className="space-y-1">
          <span className="inline-block bg-[#E6F5F0] text-secondary text-label-sm font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-secondary-fixed">
            WHOLESALE ORDER RECEIVED
          </span>
          <h1 className="text-headline-md font-bold text-primary">
            ✓ Order Received Successfully
          </h1>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            Your wholesale towel order has been received. {currentMill.name || 'SSTextiles'} will verify your payment and confirm the order.
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant grid grid-cols-2 gap-3 text-left">
          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Order Number</span>
            <span className="text-headline-sm font-bold text-primary font-mono">{displayOrderNumber}</span>
          </div>

          <div>
            <span className="text-label-sm text-outline font-bold uppercase block">Order Status</span>
            <span className="inline-flex items-center gap-1 text-label-md font-bold text-primary capitalize bg-surface-container px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {orderStatus}
            </span>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <span className="text-label-sm text-outline font-bold uppercase block">Payment Status</span>
            <span
              className={`inline-flex items-center gap-1 text-label-md font-bold capitalize px-2 py-0.5 rounded border ${paymentStatus.toLowerCase() === 'paid'
                  ? 'text-secondary bg-[#E6F5F0] border-secondary-fixed'
                  : 'text-[#B76E00] bg-[#FFF4E5] border-[#FFE2B3]'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${paymentStatus.toLowerCase() === 'paid' ? 'bg-secondary' : 'bg-[#B76E00] pulse-live'
                  }`}
              ></span>
              {paymentStatus.toLowerCase() === 'paid' ? 'Paid' : 'Pending Verification'}
            </span>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <span className="text-label-sm text-outline font-bold uppercase block">Invoice Status</span>
            {paymentStatus.toLowerCase() === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-label-sm font-bold text-secondary bg-[#E6F5F0] border border-secondary-fixed px-2 py-0.5 rounded w-max">
                <span className="material-symbols-outlined text-sm">receipt</span>
                Invoice Generated
              </span>
            ) : (
              <span className="text-label-sm font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded block w-max">
                Not Generated (Pending Payment)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          {paymentStatus.toLowerCase() === 'paid' && (
            <Link
              to={`/invoice/${order?._id || displayOrderNumber}`}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/90 text-white rounded-lg font-label-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>View Tax Invoice</span>
            </Link>
          )}

          <Link
            to={`/orders/${order?._id || displayOrderNumber}`}
            className="px-5 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">visibility</span>
            <span>View Order Details</span>
          </Link>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded-lg font-label-md font-bold flex items-center justify-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Payment & Invoice Note */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2 text-on-surface-variant">
        <div className="flex items-center gap-2 text-primary font-bold">
          <span className="material-symbols-outlined text-secondary">info</span>
          <span className="text-label-md">Payment &amp; Final Invoice Note:</span>
        </div>
        <p className="text-body-sm leading-relaxed">
          {currentMill.name || 'Gowtham Tex'} does not process automatic payments on the website. Once our accounting desk verifies your remittance (via UPI, Bank Transfer or Cash), your order payment status will be marked as <strong>PAID</strong> and your official <strong>Final GST Tax Invoice</strong> will be generated.
        </p>
        {(() => {
          const rawPhone = currentMill.phone || '80728 65362, 94890 40067, 95666 47834';
          const rawDigits = rawPhone.replace(/\D/g, '');
          const cleanTel = rawPhone.startsWith('+') ? rawPhone.replace(/[^\d+]/g, '') : `+91${rawDigits.slice(-10)}`;
          const whatsappDigits = rawDigits.length === 10 ? `91${rawDigits}` : (rawDigits.startsWith('91') && rawDigits.length === 12 ? rawDigits : `91${rawDigits.slice(-10)}`);
          const orderNum = order?.orderNumber || order?.orderId || order?._id || displayOrderNumber || id || '';
          const orderTotal = Number(order?.totalAmount || order?.total || order?.subtotal || 0);
          const whatsappMsg = `Hello ${currentMill.name || 'Gowtham Tex'}, I have placed Order #${orderNum}${orderTotal > 0 ? ` for ₹${orderTotal.toLocaleString('en-IN')}` : ''}. Please confirm dispatch and banking verification.`;

          return (
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant text-label-sm">
              <div>
                <span className="text-outline text-xs block">Official Mill Dispatch Desk:</span>
                <a
                  href={`tel:${cleanTel}`}
                  className="text-primary font-mono font-bold hover:text-secondary inline-flex items-center gap-1 transition-colors"
                  title="Click to Call Hotline"
                >
                  <span className="material-symbols-outlined text-sm text-secondary">call</span>
                  <span>{rawPhone}</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${cleanTel}`}
                  className="px-3 py-1.5 bg-white border border-outline-variant text-primary rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-surface-container shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">call</span>
                  <span>Call Desk</span>
                </a>
                <a
                  href={`https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-secondary text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-[#00513e] shadow-2xs active:scale-95 transition-all"
                  title="Send Order on WhatsApp"
                >
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  <span>WhatsApp Desk</span>
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderSuccess;

