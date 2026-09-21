import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';

export const Checkout = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    totalPieces,
    grossSubtotal,
    taxableValue,
    gstAmount,
    netPayable,
    totalWeightKg,
    baleCount,
    clearCart,
  } = useCart();

  const { currentUser } = useAuth();
  const { createOrder } = useOrders();

  // Customer Details Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    gstin: '',
  });

  // Delivery Details Form State
  const [deliveryForm, setDeliveryForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: 'Erode',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '638001',
    contactPhone: '',
    transporter: 'VRL Logistics Cargo',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Auto-fill from currentUser profile
  useEffect(() => {
    if (currentUser) {
      setCustomerForm({
        name: currentUser.name || '',
        businessName: currentUser.companyName || currentUser.businessName || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        gstin: currentUser.gstin || '',
      });

      setDeliveryForm((prev) => ({
        ...prev,
        addressLine1: currentUser.address || prev.addressLine1 || '',
        city: currentUser.city || prev.city || 'Erode',
        state: currentUser.state || prev.state || 'Tamil Nadu',
        stateCode: currentUser.stateCode || prev.stateCode || '33',
        pincode: currentUser.pincode || prev.pincode || '638001',
        contactPhone: currentUser.phone || prev.contactPhone || '',
      }));
    }
  }, [currentUser]);

  // If cart is empty
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-primary">
          <span className="material-symbols-outlined text-3xl">shopping_cart</span>
        </div>
        <h2 className="text-headline-sm font-bold text-primary">No Items in Order</h2>
        <p className="text-body-sm text-on-surface-variant">
          Please select towel sizes and add items to your cart before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="inline-block px-5 py-2.5 bg-primary text-white rounded-lg font-bold shadow hover:bg-primary/90 transition-all"
        >
          Browse Towel Catalog
        </Link>
      </div>
    );
  }

  // Frontend MOQ & Stock Pre-validation
  const invalidMoqItem = cartItems.find((item) => Number(item.quantity) < 40);
  const invalidStockItem = cartItems.find(
    (item) => item.availableStock !== undefined && Number(item.quantity) > Number(item.availableStock)
  );

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate MOQ
    if (invalidMoqItem) {
      setErrorMessage('Minimum order is 40 pieces. Please order at least 40 pieces.');
      return;
    }

    // 2. Validate Stock
    if (invalidStockItem) {
      setErrorMessage(
        `Only ${invalidStockItem.availableStock} pieces are currently available for ${invalidStockItem.productName} (${invalidStockItem.size}).`
      );
      return;
    }

    // 3. Validate required fields
    if (!customerForm.name || !customerForm.phone || !customerForm.email) {
      setErrorMessage('Please fill in your Customer Name, Phone Number, and Email.');
      return;
    }

    if (!deliveryForm.addressLine1 || !deliveryForm.city || !deliveryForm.state || !deliveryForm.pincode || !deliveryForm.contactPhone || !deliveryForm.transporter?.trim()) {
      setErrorMessage('Please complete all required Delivery Address and Logistics / Transport fields.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customerDetails: {
        name: customerForm.name.trim(),
        businessName: customerForm.businessName.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim(),
        gstin: customerForm.gstin.trim().toUpperCase(),
        state: deliveryForm.state.trim(),
        stateCode: deliveryForm.stateCode ? deliveryForm.stateCode.trim() : '',
      },
      deliveryDetails: {
        addressLine1: deliveryForm.addressLine1.trim(),
        addressLine2: deliveryForm.addressLine2.trim(),
        city: deliveryForm.city.trim(),
        state: deliveryForm.state.trim(),
        stateCode: deliveryForm.stateCode ? deliveryForm.stateCode.trim() : '',
        pincode: deliveryForm.pincode.trim(),
        contactPhone: deliveryForm.contactPhone.trim(),
        transporter: deliveryForm.transporter.trim(),
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        productName: item.productName || item.productTitle,
        sizeId: item.sizeId,
        size: item.size,
        quantity: Number(item.quantity),
      })),
      discount: 0,
      tax: gstAmount || 0,
    };

    const res = await createOrder(payload);

    if (res.success && res.order) {
      // Clear cart only after successful order creation
      clearCart();
      setIsSubmitting(false);
      navigate(`/order-success/${res.order._id || res.order.orderNumber}`);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || 'Failed to place order. Please check stock and try again.');
    }
  };

  return (
    <div className="w-full pb-24">
      <main className="px-4 pt-4 space-y-6 max-w-lg md:max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary pulse-live"></span>
              <span className="font-label-sm text-label-sm tracking-wider text-secondary font-bold uppercase">
                SSTEXTILES B2B CHECKOUT
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
              STEP 2 OF 2
            </span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-md font-bold text-primary tracking-tight">
            Wholesale Checkout &amp; Order Placement
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Provide customer details, delivery location, and confirm your wholesale towel consignment.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
            <div className="flex-1 text-body-sm">
              <p className="font-bold">Order Validation Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Columns: Forms */}
          <div className="space-y-6 md:col-span-2">
            {/* 1. Customer Details */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="font-title-md text-title-md text-primary font-bold">
                    Customer Details
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/40 px-2.5 py-0.5 rounded font-bold">
                  DIRECT MILL INVOICING
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Contact / Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Rajendran"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Business / Company Legal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surya Hotels &amp; Resorts"
                    value={customerForm.businessName}
                    onChange={(e) => setCustomerForm({ ...customerForm, businessName: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Mobile / Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98421 55670"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@company.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant font-semibold mb-1">
                    GSTIN (Optional for GST Input Tax Credit)
                  </label>
                  <input
                    type="text"
                    placeholder="33AAACG0189M1Z8"
                    value={customerForm.gstin}
                    onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary font-mono uppercase focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 2. Delivery Details */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="font-title-md text-title-md text-primary font-bold">
                    Delivery Address &amp; Transporter
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                  SURFACE CARGO
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Door No., Street name, Industrial Estate"
                    value={deliveryForm.addressLine1}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, addressLine1: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Landmark, Area, Near Ring Road"
                    value={deliveryForm.addressLine2}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, addressLine2: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                      City / Hub <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryForm.city}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryForm.state}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, state: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                      State Code
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={deliveryForm.stateCode || ''}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, stateCode: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                      placeholder="33"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary font-mono font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryForm.pincode}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, pincode: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                    Consignee Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile number of warehouse / receiving staff"
                    value={deliveryForm.contactPhone}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, contactPhone: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Preferred Logistics / Transport Text Input */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                      Preferred Logistics / Transport Name <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-secondary font-bold font-mono bg-secondary-fixed/40 px-2 py-0.5 rounded">
                      FREIGHT TO-PAY
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Type your transport name (e.g. VRL Logistics, ABT Parcel, ARC, Self-Pickup)"
                    value={deliveryForm.transporter}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, transporter: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 font-body-md text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />

                  {/* Quick Suggestions Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-xs text-outline font-medium">Quick Suggestions:</span>
                    {['VRL Logistics Cargo', 'ABT Parcel Service', 'ARC Transports', 'KPN Speed Cargo', 'Self-Pickup (Mill Depot)'].map((carrier) => (
                      <button
                        key={carrier}
                        type="button"
                        onClick={() => setDeliveryForm({ ...deliveryForm, transporter: carrier })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${deliveryForm.transporter === carrier
                            ? 'bg-primary text-white border-primary font-bold'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                          }`}
                      >
                        + {carrier}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-on-surface-variant mt-1.5">
                    Type your preferred lorry/parcel service for delivery. Mill will dispatch freight to-pay to this transporter.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="space-y-4">
            <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4 sticky top-20">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container">
                <h2 className="font-title-md text-title-md text-primary font-bold">
                  Order Summary
                </h2>
                <span className="font-label-sm text-label-sm font-mono text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded font-bold">
                  {totalPieces} PCS
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const itemSub = Number(item.price) * Number(item.quantity);
                  return (
                    <div
                      key={item.cartItemId}
                      className="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.productImage || item.image ? (
                          <img
                            src={item.productImage || item.image}
                            alt={item.productName}
                            className="w-11 h-11 rounded-lg object-contain p-0.5 border border-outline-variant bg-surface-container-low shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary shrink-0">
                            GT
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-label-md font-bold text-primary truncate">
                            {item.productName || item.productTitle}
                          </p>
                          <p className="text-body-sm text-on-surface-variant">
                            Size: <span className="font-semibold text-primary font-mono">{item.size}</span>
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            ₹{item.price} × {item.quantity} pcs
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-title-md font-bold text-primary font-mono block">
                          ₹{itemSub.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2 pt-2 border-t border-surface-container text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Subtotal:</span>
                  <span className="font-mono font-semibold">₹{grossSubtotal.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Taxable Value:</span>
                  <span className="font-mono font-semibold">₹{taxableValue.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">GST 5%:</span>
                  <span className="font-mono font-semibold">+₹{gstAmount.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Approximate Weight:</span>
                  <span className="font-mono font-bold text-primary">
                    {totalWeightKg} KG
                  </span>
                </div>

                <div className="pt-3 border-t border-outline-variant flex justify-between items-baseline">
                  <div>
                    <span className="font-title-md text-primary font-bold block">
                      Grand Total
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Inclusive of all taxes
                    </span>
                  </div>
                  <span className="font-headline-md text-headline-md text-primary font-bold font-mono">
                    ₹{netPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!invalidMoqItem || !!invalidStockItem}
                className="w-full h-12 bg-primary-container hover:bg-primary text-white rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Placing Order...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    <span>Place Wholesale Order</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-surface-container rounded-xl text-label-sm text-on-surface-variant space-y-1">
                <div className="flex items-center gap-1 text-primary font-bold">
                  <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                  <span>Payment Process:</span>
                </div>
                <p>
                  Payment is handled outside the website. SSTextiles admin will verify payment upon order submission and issue the final GST invoice.
                </p>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
