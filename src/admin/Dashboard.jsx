import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, deduplicateOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';
import { playNewOrderSound, requestNotificationPermission, showDesktopNotification } from '../utils/soundAlert';

export const Dashboard = () => {
  const { orders, fetchAdminOrders, updateOrderStatus } = useOrders();
  const { products, millSettings } = useProducts();
  const currentMill = millSettings || millInfo;
  const [filterTab, setFilterTab] = useState('ALL');
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const prevOrdersCountRef = useRef(null);

  useEffect(() => {
    fetchAdminOrders();
    requestNotificationPermission();

    const interval = setInterval(() => {
      fetchAdminOrders();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchAdminOrders]);

  // Strictly deduplicated list of orders
  const uniqueOrders = useMemo(() => {
    return deduplicateOrders(orders || []);
  }, [orders]);

  // Detect new incoming orders and ring chime
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

  const filteredOrders = useMemo(() => {
    return uniqueOrders.filter(order => {
      const st = (order.orderStatus || order.status || '').toLowerCase();
      const pm = (order.paymentStatus || '').toLowerCase();
      if (filterTab === 'ALL') return true;
      if (filterTab === 'PENDING') return st.includes('loading') || st.includes('verified') || st.includes('new') || pm === 'pending';
      if (filterTab === 'TRANSIT') return st.includes('transit') || st.includes('dispatched') || st.includes('ready_for_dispatch') || st.includes('processing');
      if (filterTab === 'DELIVERED') return st.includes('delivered');
      return true;
    });
  }, [uniqueOrders, filterTab]);

  const totalRevenue = useMemo(() => {
    return uniqueOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || o.totalPayable || o.subtotal || 0), 0);
  }, [uniqueOrders]);

  const totalPieces = useMemo(() => {
    return uniqueOrders.reduce((sum, o) => sum + (o.totalPieces || o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0);
  }, [uniqueOrders]);

  return (
    <div className="space-y-4">
      {/* Page Title & Sound Controls */}
      <section className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider font-bold">
            Dispatch &amp; Logistics Node
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNewOrderSound();
              }}
              className={`px-3 py-1 rounded-lg border text-label-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-[#E6F5F0] border-secondary-fixed text-secondary'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant'
              }`}
              title="Toggle pop sound effect for new orders"
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span>{soundEnabled ? 'Pop Alert: ON' : 'Pop Alert: Muted'}</span>
            </button>
            <span className="text-label-sm font-label-sm text-on-surface-variant flex items-center">
              <span className="material-symbols-outlined text-[14px] mr-1">verified_user</span>
              GSTIN {currentMill.gstin || '33BRWPV7711D1ZD'}
            </span>
          </div>
        </div>
        <h1 className="text-headline-lg-mobile md:text-headline-md font-bold text-primary tracking-tight">
          Wholesale Order Fulfillment &amp; Invoices
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Manage live dispatch schedules, transport bilties, and instant tax e-invoicing.
        </p>
      </section>

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

      {/* Horizontal Scroll Filter Tabs */}
      <section className="overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
        <div className="flex space-x-2 w-max">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md shadow-sm flex items-center space-x-1.5 transition-colors ${
              filterTab === 'ALL'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-primary text-[10px] font-bold">
              {uniqueOrders.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors ${
              filterTab === 'PENDING'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Pending Dispatch</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant text-[10px] font-bold">
              {uniqueOrders.filter(o => {
                const st = (o.orderStatus || o.status || '').toLowerCase();
                const pm = (o.paymentStatus || '').toLowerCase();
                return st.includes('loading') || st.includes('verified') || st.includes('new') || pm === 'pending';
              }).length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('TRANSIT')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors ${
              filterTab === 'TRANSIT'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>In Transit</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant text-[10px] font-bold">
              {uniqueOrders.filter(o => {
                const st = (o.orderStatus || o.status || '').toLowerCase();
                return st.includes('transit') || st.includes('dispatched') || st.includes('ready_for_dispatch') || st.includes('processing');
              }).length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('DELIVERED')}
            className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center space-x-1.5 transition-colors ${
              filterTab === 'DELIVERED'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Delivered</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant text-[10px] font-bold">
              {uniqueOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase().includes('delivered')).length}
            </span>
          </button>
        </div>
      </section>

      {/* Revenue & Dispatch Metric Snapshot Card */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary-fixed opacity-20 rounded-bl-full pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3 border-b border-surface-container pb-2">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
            <span className="text-label-md font-label-md text-primary font-bold">
              Today's Wholesale Bookings
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-container text-on-secondary-container font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1 pulse-live"></span>Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border-r border-surface-container pr-2">
            <p className="text-label-sm font-label-sm text-on-surface-variant mb-0.5 font-bold uppercase">
              Commercial Volume
            </p>
            <p className="text-metric-display font-metric-display text-primary font-mono">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-label-sm text-secondary flex items-center mt-0.5 font-bold">
              <span className="material-symbols-outlined text-[13px] mr-0.5">trending_up</span>
              +18.4% vs yesterday
            </span>
          </div>

          <div className="pl-1">
            <p className="text-label-sm font-label-sm text-on-surface-variant mb-0.5 font-bold uppercase">
              Scheduled Dispatch
            </p>
            <p className="text-metric-display font-metric-display text-primary font-mono">
              {totalPieces.toLocaleString('en-IN')}{' '}
              <span className="text-label-md font-label-md font-normal text-on-surface-variant">
                Pcs
              </span>
            </p>
            <p className="text-[11px] font-label-sm text-on-surface-variant mt-0.5">
              Approx. {(totalPieces * 0.12).toFixed(1)} KG total consignment weight
            </p>
          </div>
        </div>
      </section>

      {/* Orders Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-title-md font-title-md text-primary font-bold">
          Recent Purchase Orders
        </h2>
        <span className="text-label-md font-label-md text-on-surface-variant flex items-center font-bold">
          <span className="material-symbols-outlined text-[16px] mr-1">filter_list</span>
          Live Feed
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-2xl">inbox</span>
            </div>
            <h3 className="text-body-lg font-bold text-primary">No Purchase Orders Found</h3>
            <p className="text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
              There are no orders matching the selected filter ({filterTab}). When wholesale buyers place new purchase orders, they will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
            const orderNum = order.orderNumber || order.id || `GTX-${order._id?.slice(-5)}`;
            const orderTotal = order.totalAmount || order.total || order.totalPayable || order.subtotal || 0;
            const buyer = order.customerDetails?.businessName || order.customerDetails?.name || order.customer?.name || order.buyerName || 'Customer';
            const orderStatus = order.orderStatus || order.status || 'new';

            let badgeStyle = "bg-[#FFF4E5] text-[#B76E00] border-[#FFE2B3]";
            let dotColor = "bg-[#B76E00]";
            let displayStatusText = orderStatus;

            if (isPaid) {
              badgeStyle = "bg-[#E6F5F0] text-secondary border-secondary-fixed font-bold";
              dotColor = "bg-secondary";
              displayStatusText = orderStatus.toLowerCase().includes('transit')
                ? 'In Transit (Paid)'
                : orderStatus.toLowerCase().includes('delivered')
                ? 'Delivered (Paid)'
                : 'Confirmed & Paid';
            } else if (orderStatus.toLowerCase().includes('transit') || orderStatus.toLowerCase().includes('dispatched')) {
              badgeStyle = "bg-[#E6F5F0] text-secondary border-secondary-container";
              dotColor = "bg-secondary";
            }

            return (
              <article
                key={order._id || order.id}
                className={`rounded-xl border p-4 transition-all shadow-sm space-y-3 ${
                  isPaid
                    ? 'bg-surface-container-lowest border-secondary-fixed/50 hover:border-secondary'
                    : 'bg-surface-container-lowest border-outline-variant hover:border-primary/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-label-lg font-label-lg font-bold text-primary font-mono">
                        #{orderNum}
                      </span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#E6F5F0] text-secondary border border-secondary-fixed">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#FFF4E5] text-[#B76E00] border border-[#FFE2B3]">
                          <span className="material-symbols-outlined text-[13px]">pending</span>
                          <span>PENDING PAY</span>
                        </span>
                      )}
                      {order.poNumber && (
                        <span className="text-[11px] font-mono text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">
                          {order.poNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-body-md font-body-md font-semibold text-primary mt-0.5">
                      {buyer}
                    </h3>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-label-sm font-label-sm font-bold border ${badgeStyle} capitalize`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5 pulse-live`}></span>
                    {displayStatusText}
                  </span>
                </div>

                {/* Spec Breakdown Box */}
                <div className="p-3 bg-surface rounded-lg border border-surface-container-high space-y-1.5">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant font-medium">Volume Breakdown:</span>
                    <span className="font-bold text-primary font-mono">
                      {order.totalPieces || order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} pcs total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-surface-container-high text-label-sm text-on-surface-variant">
                    {order.items?.map((item, idx) => (
                      <span key={idx} className="flex items-center">
                        <span className="material-symbols-outlined text-[14px] mr-1 text-on-surface-variant">straighten</span>
                        {item.quantity} pcs • {item.size || item.dimension} ({item.productName || item.productTitle || 'Towel'})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Logistics & Finance Info Grid */}
                <div className="flex flex-wrap items-center justify-between text-body-sm gap-2">
                  <div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block font-bold uppercase">
                      Consignment Value
                    </span>
                    <span className="text-title-md font-title-md font-bold text-primary font-mono">
                      ₹{orderTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">
                      Incl. 5% GST
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-label-sm font-label-sm text-on-surface-variant block font-bold uppercase">
                      Freight Carrier &amp; Payment
                    </span>
                    <span className="text-label-md font-label-md font-semibold text-primary flex items-center justify-end">
                      <span className="material-symbols-outlined text-[15px] mr-1">local_shipping</span>
                      {order.deliveryDetails?.transporter || order.transporter || 'VRL Logistics Cargo'}
                    </span>
                    {isPaid ? (
                      <span className="text-xs text-secondary font-mono font-bold flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>PAID ({order.invoiceNumber || 'Invoiced'})</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#B76E00] font-mono font-bold">
                        PAYMENT PENDING
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={isPaid ? `/invoice/${order._id || orderNum}` : `/admin/orders?checkOrder=${order._id || orderNum}`}
                  className={`w-full py-2.5 px-3 rounded-lg font-label-lg text-label-lg font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm ${
                    isPaid
                      ? 'bg-primary-container text-white hover:bg-primary'
                      : 'bg-secondary text-white hover:bg-secondary/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPaid ? 'receipt_long' : 'fact_check'}
                  </span>
                  <span>{isPaid ? 'View Tax Invoice (Paid)' : 'Check Bill & Confirm'}</span>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
