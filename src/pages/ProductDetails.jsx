import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { SizeSelector } from '../components/SizeSelector';
import { VolumeConfigurator } from '../components/VolumeConfigurator';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

const DEFAULT_TOWEL_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sizeParam = searchParams.get('size') || '';

  const { getProductById, millSettings } = useProducts();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Selected dynamic size state
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Quantity state: starts at 40 (or selectedSize MOQ, e.g. 100 pcs preset as in Stitch design)
  const [quantity, setQuantity] = useState(100);
  const [showAddedBanner, setShowAddedBanner] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const result = await getProductById(id);
      if (result.success && result.product && result.product.active !== false && result.product.status !== 'Inactive') {
        setProduct(result.product);
        const sizes = result.product.sizes || [];

        // Check if a specific size was requested via URL ?size=
        const normalizedParam = sizeParam.replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
        const requestedSize = normalizedParam
          ? sizes.find((s) => {
              const sId = (s.id || s._id || '').toLowerCase();
              const sDim = (s.dimension || s.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
              return sId === normalizedParam || sDim.includes(normalizedParam);
            })
          : null;

        // Default to requested size, or first popular in-stock size, or first size
        const defaultSize =
          requestedSize ||
          sizes.find((s) => s.stock > 0 && s.isPopular) ||
          sizes.find((s) => s.stock > 0) ||
          sizes[0] ||
          null;
        setSelectedSize(defaultSize);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('[ProductDetails] Error loading product:', err);
      setError('Unable to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, getProductById]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Loading Screen
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Loading towel specifications from mill database...</p>
      </div>
    );
  }

  // Not Found Screen
  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
        <h2 className="text-headline-sm font-bold text-primary">Product Not Found</h2>
        <p className="text-body-sm text-on-surface-variant">
          The towel product you are looking for does not exist or has been deactivated.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  // Error Screen
  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-outline">cloud_off</span>
        <h2 className="text-headline-sm font-bold text-primary">Unable to Load Product</h2>
        <p className="text-body-sm text-on-surface-variant">{error || 'Unable to load product details. Please try again.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={loadProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Retry</span>
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md font-bold"
          >
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const unitRate = selectedSize ? Number(selectedSize.price) : 0;
  const numQuantity = Number(quantity) || 0;
  const calculatedSubtotal = Math.round(unitRate * numQuantity);
  
  const selectedStock = Number(selectedSize?.stock ?? 0);
  const isOutOfStock = !selectedSize || selectedStock === 0;
  const isStockBelowMoq = selectedStock > 0 && selectedStock < 40;
  const isAddDisabled = !selectedSize || isOutOfStock || isStockBelowMoq || numQuantity < 40 || numQuantity > selectedStock;

  const handleAdd = () => {
    if (selectedSize) {
      const res = addToCart(product, selectedSize, quantity);
      if (res?.success !== false) {
        setShowAddedBanner(true);
      }
    }
  };

  const handleBuyNow = () => {
    if (selectedSize) {
      const res = addToCart(product, selectedSize, quantity);
      if (res.success) {
        navigate('/cart');
      }
    }
  };

  return (
    <div className="w-full pb-12 md:pb-16">
      <main className="w-full max-w-md md:max-w-4xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* SUB-HEADER: BACK NAVIGATION & BREADCRUMB */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs border border-outline-variant transition-all group active:scale-95 shadow-2xs"
              title="Return to Towel Catalog to browse other products"
            >
              <span className="material-symbols-outlined text-base text-secondary group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span>Back to Towel Catalog</span>
            </Link>

            <span className="bg-[#EFECE6] text-on-surface-variant font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-[#D5CFC5] font-bold">
              MOQ: {selectedSize?.moq || 40} PCS
            </span>
          </div>

          {/* Quick Breadcrumb / Nav */}
          <div className="flex items-center gap-1.5 text-label-sm text-outline">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Catalog</Link>
            <span>/</span>
            <span className="text-primary font-bold truncate max-w-[180px] sm:max-w-none">{product.title || product.name}</span>
          </div>
        </section>

        {/* HERO PRODUCT SHOWCASE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Image and Specs */}
          {(() => {
            const productImages = (product.images && product.images.length > 0)
              ? product.images.filter(Boolean)
              : [product.image || DEFAULT_TOWEL_IMAGE];
            const currentImg = productImages[selectedImageIndex] || productImages[0] || DEFAULT_TOWEL_IMAGE;

            return (
              <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant flex items-center justify-center cursor-zoom-in group/img shadow-xs"
                  title="Click to view full photo gallery"
                >
                  <img
                    src={currentImg}
                    alt={product.title || product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_TOWEL_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />

                  {/* Previous / Next Angle Quick Switchers on Image */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                        title="Previous Angle"
                        aria-label="Previous Angle"
                      >
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                        title="Next Angle"
                        aria-label="Next Angle"
                      >
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                      </button>
                    </>
                  )}

                  {/* Full Photo Floating Pill */}
                  <div className="absolute top-3 right-3 bg-black/65 hover:bg-black/85 text-white px-2.5 py-1 rounded-md text-label-sm font-semibold opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 shadow-sm backdrop-blur-xs">
                    <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                    <span>{productImages.length > 1 ? `${productImages.length} Photos` : 'Click for Full Photo'}</span>
                  </div>

                  {/* Live Inventory Indicator Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full border border-outline-variant shadow-xs">
                    <span className={`w-2 h-2 rounded-full ${product.totalStock > 0 ? 'bg-secondary pulse-live' : 'bg-error'}`}></span>
                    <span className={`font-label-sm text-label-sm font-bold ${product.totalStock > 0 ? 'text-secondary' : 'text-error'}`}>
                      {product.totalStock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </div>

                  {/* Angle & Material Badge */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {productImages.length > 1 && (
                      <span className="bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                        {selectedImageIndex === 0 ? 'Front' : selectedImageIndex === 1 ? 'Back' : `Angle ${selectedImageIndex + 1}`}
                      </span>
                    )}
                    <div className="bg-primary-container/90 backdrop-blur-sm text-surface-container-lowest px-2.5 py-1 rounded-md font-label-sm text-label-sm flex items-center gap-1 shadow-xs">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>{/cotton/i.test(product.material || '') ? 'Cotton' : (product.material || 'Cotton')}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Angle Thumbnails Strip */}
                {productImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {productImages.map((img, idx) => {
                      const isSelected = selectedImageIndex === idx;
                      const label = idx === 0 ? 'Front View' : idx === 1 ? 'Back Side' : idx === 2 ? 'Detail Texture' : `Angle ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-16 w-20 sm:h-20 sm:w-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/30 scale-95 shadow-sm'
                              : 'border-outline-variant opacity-70 hover:opacity-100 hover:border-primary/50'
                          }`}
                          title={label}
                        >
                          <img src={img} alt={label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold py-0.5 text-center uppercase tracking-wider truncate">
                            {idx === 0 ? 'Front' : idx === 1 ? 'Back' : `Angle ${idx + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Spec & Highlights */}
                <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
                        {product.title || product.name}
                      </h1>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {product.subtitle || product.description}
                      </p>
                    </div>
                    <span className="bg-[#F1F5F9] text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-md font-bold border border-outline-variant flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">receipt</span> GST COMPLIANT
                    </span>
                  </div>

                  {/* Metric Specs Pills */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-surface-container-low p-2.5 rounded-lg text-center border border-outline-variant">
                      <span className="block font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider">MATERIAL</span>
                      <span className="font-title-md text-title-md text-primary font-bold">{/cotton/i.test(product.material || '') ? 'Cotton' : (product.material || 'Cotton')}</span>
                    </div>
                    <div className="bg-surface-container-low p-2.5 rounded-lg text-center border border-outline-variant">
                      <span className="block font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider">WEAVE TYPE</span>
                      <span className="font-title-md text-title-md text-primary font-bold">{product.weaveType || '20s'}</span>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Right Column: Dynamic Sizes, Volume Configuration & Purchase Actions */}
          <div className="flex flex-col gap-4">
            {/* DYNAMIC SIZES SELECTOR */}
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">straighten</span> MILL-CONFIGURED SPECIFICATIONS
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Dynamic Towel Dimensions
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Tap size to select
                </span>
              </div>

              {/* Dynamic Size Cards */}
              <SizeSelector
                sizes={product.sizes || []}
                selectedSize={selectedSize}
                onSelectSize={(s) => setSelectedSize(s)}
              />
            </section>

            {/* SELECTED SIZE CONFIGURATOR & BULK STEPPER */}
            <VolumeConfigurator
              selectedSize={selectedSize}
              quantity={quantity}
              onQuantityChange={setQuantity}
              minMoq={selectedSize?.moq || 40}
            />

            {/* ORDER SUMMARY & IN-CARD PURCHASE ACTIONS */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <span className="font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider">
                  COMMERCIAL ORDER TOTAL
                </span>
                <span className="text-body-sm font-mono font-bold text-primary bg-surface-container-low px-2 py-0.5 rounded border border-border-subtle">
                  Unit Rate: ₹{unitRate.toFixed(2)}/pc
                </span>
              </div>

              {/* Subtotal Display */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="font-title-md text-title-md text-primary font-bold block">
                    Subtotal:
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">
                    ({quantity} pcs • {selectedSize?.dimension || selectedSize?.size || 'Selected Size'})
                  </span>
                </div>
                <span className="font-metric-display text-metric-display text-primary font-mono font-bold">
                  ₹{calculatedSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAddDisabled}
                  className={`h-12 px-3 border rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isAddDisabled
                      ? 'bg-surface-container-low text-outline border-outline-variant cursor-not-allowed opacity-60'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-primary border-outline-variant active:scale-98 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  <span className="truncate">
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isStockBelowMoq
                      ? 'Insufficient Stock'
                      : 'Add to Cart'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isAddDisabled}
                  className={`h-12 px-4 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isAddDisabled
                      ? 'bg-surface-container text-outline cursor-not-allowed opacity-60'
                      : 'bg-primary-container hover:bg-[#1E3A5F] text-surface-container-lowest active:scale-98'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span className="truncate">
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isStockBelowMoq
                      ? 'Stock < 40'
                      : 'Buy Now'}
                  </span>
                </button>
              </div>

              {/* Post-Add Confirmation Banner with Back Arrow */}
              {showAddedBanner && (
                <div className="pt-2 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-[#E6F5F0] border border-secondary-fixed rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2 text-secondary w-full sm:w-auto">
                      <span className="material-symbols-outlined text-xl shrink-0">check_circle</span>
                      <div>
                        <span className="text-xs font-bold text-primary block leading-tight">Added to Wholesale Cart!</span>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          {quantity} pcs • {selectedSize?.dimension || selectedSize?.size}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        to="/products"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-surface-container text-primary text-xs font-bold border border-outline-variant shadow-2xs transition-all active:scale-95"
                        title="Browse other wholesale towels"
                      >
                        <span className="material-symbols-outlined text-base text-secondary">arrow_back</span>
                        <span>Browse Other Products</span>
                      </Link>
                      <Link
                        to="/cart"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-[#00513e] text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
                      >
                        <span>View Cart</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Full Photo Lightbox Modal */}
      {product && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={(product.images && product.images.length > 0) ? product.images.filter(Boolean) : [product.image || DEFAULT_TOWEL_IMAGE]}
          initialIndex={selectedImageIndex}
          imageAlt={product.title || product.name}
          title={product.title || product.name}
          subtitle={`${/cotton/i.test(product.material || '') ? 'Cotton' : (product.material || 'Cotton')} • ${product.weaveType || '20s'} • High-Res Mill Gallery`}
        />
      )}
    </div>
  );
};

