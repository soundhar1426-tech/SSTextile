import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const DEFAULT_TOWEL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw';

export const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPieces,
    grossSubtotal,
    cartSubtotal,
    taxableValue,
    gstAmount,
    netPayable,
    totalWeightKg,
    baleCount,
    toastMessage,
    showToast,
  } = useCart();

  const handleDecrease = (item) => {
    if (item.quantity <= 40) {
      showToast('Minimum order quantity is 40 pieces.', 'warning');
      return;
    }
    const nextQty = Math.max(40, item.quantity - 10);
    updateQuantity(item.cartItemId, nextQty);
  };

  const handleIncrease = (item) => {
    if (item.availableStock !== undefined && item.quantity >= item.availableStock) {
      showToast(`Only ${item.availableStock} pieces are available.`, 'warning');
      return;
    }
    const nextQty = item.availableStock !== undefined
      ? Math.min(item.availableStock, item.quantity + 10)
      : item.quantity + 10;
    updateQuantity(item.cartItemId, nextQty);
  };

  // Empty Cart State
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-outline">
          <span className="material-symbols-outlined text-3xl">shopping_cart</span>
        </div>
        <h2 className="text-headline-sm font-bold text-primary">Your cart is empty</h2>
        <p className="text-body-sm text-on-surface-variant">
          Add wholesale towel products to your cart to continue.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-lg font-label-md font-bold hover:bg-primary transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          <span>Browse Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-36 md:pb-24">
      <main className="px-4 pt-4 space-y-4 max-w-lg md:max-w-4xl mx-auto">
        {/* Screen Title & Verification Header Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs border border-outline-variant transition-all group active:scale-95 shadow-2xs"
              title="Return to Towel Catalog to browse and add other products"
            >
              <span className="material-symbols-outlined text-base text-secondary group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span>Back to Towel Catalog</span>
            </Link>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant">
              <span className="material-symbols-outlined text-secondary text-sm material-symbols-filled">
                verified
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                GST VERIFIED WHOLESALE
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-md font-bold text-primary tracking-tight">
              Wholesale Shopping Cart
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Review your dynamic towel sizes, quantities, and bulk order proforma totals.
            </p>
          </div>
        </div>

        {/* Floating / Inline Toast Message */}
        {toastMessage && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-2 text-body-sm font-semibold transition-all ${
              toastMessage.type === 'error'
                ? 'bg-error-container text-error border-error'
                : toastMessage.type === 'warning'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-secondary-container text-secondary border-secondary-fixed'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {toastMessage.type === 'error'
                ? 'error'
                : toastMessage.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Bulk Order Metric Banner */}
        <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant">
          <div className="border-r border-outline-variant pr-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant block font-bold uppercase">
              TOTAL PIECES
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-metric-display text-metric-display text-primary font-mono">
                {totalPieces}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                PCS
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-0.5 mt-0.5 font-semibold">
              <span className="material-symbols-outlined text-xs">local_shipping</span>
              Direct Mill Wholesale Rate
            </span>
          </div>

          <div className="pl-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant block font-bold uppercase">
              APPROXIMATE SHIP WEIGHT
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-metric-display text-metric-display text-primary font-mono">
                {totalWeightKg}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                KG
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">
              Approximate Weight • Cotton Towels
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Cart Items List */}
          <section className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-title-md text-title-md text-primary font-bold">
                Cart Items ({cartItems.length})
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearCart}
                  className="text-label-sm text-error hover:underline font-bold"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Item Cards */}
            <div className="space-y-3">
              {cartItems.map((item) => {
                const itemSubtotal = item.price * item.quantity;
                const isAtMinMoq = item.quantity <= 40;
                const isAtMaxStock =
                  item.availableStock !== undefined && item.quantity >= item.availableStock;

                return (
                  <article
                    key={item.cartItemId}
                    className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-surface-container-low flex-shrink-0 overflow-hidden border border-outline-variant flex items-center justify-center">
                        <img
                          src={item.productImage || item.image || DEFAULT_TOWEL_IMAGE}
                          alt={item.productName || item.productTitle}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_TOWEL_IMAGE;
                          }}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-title-md text-title-md text-primary font-bold leading-tight">
                            {item.productName || item.productTitle}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-outline hover:text-error transition-colors p-1 flex items-center gap-1 text-label-sm font-semibold"
                            title="Remove item"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                        <p className="font-body-sm text-body-sm text-primary font-semibold mt-0.5">
                          Size: {item.size || item.dimension}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          ₹{item.price} / piece
                        </p>
                        <p className="text-label-sm text-secondary font-medium">
                          Available stock: {item.availableStock ?? 'In Stock'} pcs
                        </p>
                      </div>
                    </div>

                    {/* Stepper, Rate, and Subtotal */}
                    <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm text-outline font-bold">Quantity:</span>
                        <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-low overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            className={`w-8 h-8 flex items-center justify-center font-bold text-primary hover:bg-surface-container active:scale-95 transition-all ${
                              isAtMinMoq ? 'text-outline cursor-not-allowed opacity-60' : ''
                            }`}
                            title={isAtMinMoq ? 'Minimum order quantity is 40 pieces.' : 'Decrease quantity'}
                          >
                            −
                          </button>
                          <span className="px-3 font-mono font-bold text-body-md text-primary min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            className={`w-8 h-8 flex items-center justify-center font-bold text-primary hover:bg-surface-container active:scale-95 transition-all ${
                              isAtMaxStock ? 'text-outline cursor-not-allowed opacity-60' : ''
                            }`}
                            title={
                              isAtMaxStock
                                ? `Only ${item.availableStock} pieces are available.`
                                : 'Increase quantity'
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-label-sm text-outline block">Subtotal:</span>
                        <span className="font-title-md text-title-md text-primary font-bold font-mono">
                          ₹{itemSubtotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Right Column: Order Summary & Actions */}
          <div className="space-y-4">
            <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container">
                <h2 className="font-title-md text-title-md text-primary font-bold">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-2 font-body-sm text-body-sm">
                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">
                    Subtotal ({totalPieces} pcs across {cartItems.length} items)
                  </span>
                  <span className="font-mono text-on-surface font-semibold">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">Taxable Value</span>
                  <span className="font-mono text-on-surface font-semibold">
                    ₹{taxableValue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">
                    GST (5% SGST 2.5% + CGST 2.5%)
                  </span>
                  <span className="font-mono text-on-surface font-semibold">
                    +₹{gstAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-on-surface-variant pt-1">
                  <span>Estimated Freight (Approx. {totalWeightKg} kg)</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container rounded font-bold">
                    To-Pay Upon Dispatch
                  </span>
                </div>

                <div className="pt-3 border-t border-outline-variant flex justify-between items-baseline">
                  <div>
                    <span className="font-title-md text-title-md text-primary font-bold block">
                      Total:
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Inclusive of GST
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-primary font-bold font-mono">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full h-12 bg-primary-container hover:bg-primary text-white rounded-lg font-label-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  <span>Proceed to Checkout</span>
                </button>

                <Link
                  to="/products"
                  className="w-full h-11 bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant rounded-lg font-label-md font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                >
                  <span className="material-symbols-outlined text-base text-secondary">arrow_back</span>
                  <span>Continue Shopping (Add Other Products)</span>
                </Link>
              </div>
            </section>

            {/* Operational Guarantee Callout */}
            <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-xl material-symbols-filled">
                verified
              </span>
              <p className="font-body-sm text-body-sm">
                Proforma Invoice (PI) will be generated with mill GSTIN and dispatch packing slip.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
