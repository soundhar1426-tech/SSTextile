import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { millInfo } from '../data/mockData';

const DEFAULT_TOWEL_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw';

export const Home = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { products, loading, fetchProducts, millSettings } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [spotlightLightboxOpen, setSpotlightLightboxOpen] = useState(false);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const normalizedQuery = (searchQuery || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();

  const activeProducts = useMemo(() => {
    return (products || []).filter((p) => p.active !== false && p.status !== 'Inactive');
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return activeProducts;

    return activeProducts.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const gsmRange = (p.gsmRange || '').toLowerCase();
      const sizes = p.sizes || [];

      const matchesMeta =
        title.includes(searchQuery.toLowerCase()) ||
        category.includes(searchQuery.toLowerCase()) ||
        gsmRange.includes(searchQuery.toLowerCase());

      const matchesSize = sizes.some((s) => {
        const dimNorm = (s.dimension || s.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
        const sId = (s.id || s._id || '').toLowerCase();
        const gsm = (s.gsm || '').toString();
        return dimNorm.includes(normalizedQuery) || sId.includes(normalizedQuery) || gsm === normalizedQuery;
      });

      return matchesMeta || matchesSize;
    });
  }, [activeProducts, searchQuery, normalizedQuery]);

  const heroProduct = activeProducts.length > 0 ? activeProducts[0] : null;
  const heroProductId = heroProduct ? (heroProduct.id || heroProduct._id) : '';

  const heroImages = useMemo(() => {
    if (!heroProduct) return [DEFAULT_TOWEL_IMAGE];
    if (Array.isArray(heroProduct.images) && heroProduct.images.length > 0) {
      return heroProduct.images.filter(Boolean);
    }
    return [heroProduct.image || DEFAULT_TOWEL_IMAGE];
  }, [heroProduct]);

  const currentHeroImage = heroImages[activeHeroImageIndex] || heroImages[0] || DEFAULT_TOWEL_IMAGE;

  const matchedHeroSize = normalizedQuery
    ? (heroProduct?.sizes || []).find((s) => {
      const sDim = (s.dimension || s.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
      const sId = (s.id || s._id || '').toLowerCase();
      return sDim.includes(normalizedQuery) || sId.includes(normalizedQuery);
    })
    : null;

  const currentMill = millSettings || millInfo;
  const millName = currentMill?.name || millInfo.name || 'SSTextiles';
  const millPhoneRaw = currentMill?.phone || millInfo.phone || '98765 43210, 98765 43211';
  const millWhatsappRaw = currentMill?.whatsapp || millInfo.whatsapp || '919876543210';
  const millTagline = currentMill?.tagline || millInfo.tagline || 'Whole Sale Hand Looms Cloth Manufacturer';
  const millSubTagline = currentMill?.subTagline || millInfo.subTagline || 'Direct Mill White Towels. Direct Loom Pricing.';
  const millAddress = currentMill?.address || millInfo.address || '123, Weaver Street, Textile Nagar, Erode - 638 001, Tamil Nadu.';
  const millGstin = currentMill?.gstin || millInfo.gstin || '33AAAAA0000A1Z5';

  const millPhoneList = useMemo(() => {
    return millPhoneRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [millPhoneRaw]);

  const activeWhatsappNumber = useMemo(() => {
    if (millWhatsappRaw) {
      const digits = millWhatsappRaw.split(',')[0].replace(/\D/g, '');
      return digits.length === 10 ? `91${digits}` : digits;
    }
    const firstPhone = millPhoneList[0] || '98765 43210';
    const digits = firstPhone.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : (digits.startsWith('91') ? digits : `91${digits.slice(-10)}`);
  }, [millWhatsappRaw, millPhoneList]);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Mill Operations Ribbon */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary pulse-live"></span>
            <span className="text-primary font-bold">SSTextiles</span>
            <span className="hidden sm:inline text-outline">• Direct Towel Manufacturer</span>
          </div>

          <div className="flex items-center gap-4 text-label-sm font-semibold text-primary">
            <span className="flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[16px] text-secondary">receipt</span>
              GSTIN: {millGstin} (5% GST)
            </span>
          </div>
        </div>
      </div>

      {/* Executive Hero Showcase Banner */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-[#0c1b33] via-[#0f1e36] to-[#08101e] text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-primary/40">
          {/* Subtle background decorative grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-[#98f4d3]/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-secondary-fixed/40 text-secondary-fixed text-label-sm font-bold tracking-wider">
              <span className="material-symbols-outlined text-sm material-symbols-filled">factory</span>
              {millTagline.toUpperCase()}
            </div>

            <h1 className="text-headline-xl-mobile sm:text-headline-xl font-bold tracking-tight leading-tight text-white">
              {millSettings?.subTagline ? (
                millSettings.subTagline.replace(/\s*(&|and)?\s*Institutional Linens/gi, '').replace(/\bterry\b\s*/gi, '').trim()
              ) : (
                <>Direct Mill White Towels.<br /><span className="text-secondary-fixed">Direct Loom Pricing.</span></>
              )}
            </h1>

            <p className="text-body-lg text-primary-fixed leading-relaxed max-w-2xl font-normal">
              Soft and highly  made for hotels, hospitals and everyday use. Durable, comfortable, and designed to handle frequent washing.
            </p>

            {/* Key Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-w-2xl">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-primary-fixed uppercase tracking-wider font-semibold">Pricing</span>
                <span className="text-label-md font-bold text-white">Direct Loom</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-primary-fixed uppercase tracking-wider font-semibold">Material</span>
                <span className="text-label-md font-bold text-white">Cotton</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-primary-fixed uppercase tracking-wider font-semibold">Min Order</span>
                <span className="text-label-md font-bold text-white">40 Pcs / Size</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] text-primary-fixed uppercase tracking-wider font-semibold">Tax Invoice</span>
                <span className="text-label-md font-bold text-white">5% GST</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={heroProductId ? `/products/${heroProductId}` : '/products'}
                className="bg-secondary text-white px-6 py-3 rounded-xl font-label-lg font-bold hover:bg-[#00513e] transition-all shadow-lg hover:shadow-secondary/20 flex items-center gap-2 active:scale-95"
              >
                <span>Configure Towel Order</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                to="/products"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-xl font-label-lg font-semibold transition-all backdrop-blur-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                <span>Browse Full Catalog</span>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-12 -bottom-12 w-96 h-96 opacity-20 pointer-events-none rounded-full border-[32px] border-primary-fixed"></div>
        </div>
      </div>

      {/* Quick Search & Filter Bar with Dimension Pills */}
      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[22px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dimension (e.g. 70×140, 30×60 cm), GSM weight, or yarn count..."
            className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-2xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-outline hover:text-primary transition-colors"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state for hero */}
      {loading && products.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-on-surface-variant">
          <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-body-md font-medium">Syncing wholesale catalog with mill database...</span>
        </div>
      )}

      {/* Flagship SKU Spotlight: Screen 1 Towel Preview */}
      {heroProduct && (
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-5 sm:p-8 shadow-sm hover:border-primary/30 transition-all">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Towel Image & Multi-Angle Gallery */}
              <div className="w-full lg:w-1/2 flex flex-col gap-3">
                <div
                  onClick={() => setSpotlightLightboxOpen(true)}
                  className="w-full relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant h-80 sm:h-96 flex items-center justify-center cursor-zoom-in group/img shadow-xs"
                  title="Click to view full photo gallery"
                >
                  <img
                    src={currentHeroImage}
                    alt={heroProduct.title || heroProduct.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_TOWEL_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />

                  {/* Previous / Next Angle Quick Switchers on Image */}
                  {heroImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHeroImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
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
                          setActiveHeroImageIndex((prev) => (prev + 1) % heroImages.length);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                        title="Next Angle"
                        aria-label="Next Angle"
                      >
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                      </button>
                    </>
                  )}

                  {/* Full Photo Floating Badge */}
                  <div className="absolute top-3.5 right-3.5 bg-black/65 hover:bg-black/85 text-white px-2.5 py-1 rounded-md text-label-sm font-semibold opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 shadow-sm backdrop-blur-xs">
                    <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                    <span>{heroImages.length > 1 ? `${heroImages.length} Photos` : 'Full Photo'}</span>
                  </div>

                  {/* Live Inventory Status */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary pulse-live"></span>
                    <span className="font-label-sm text-label-sm font-bold uppercase text-secondary">
                      READY TO DISPATCH
                    </span>
                  </div>

                  {/* Bottom Image Badges: Angle Label & Material */}
                  <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5">
                    {heroImages.length > 1 && (
                      <span className="bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {activeHeroImageIndex === 0 ? 'Front' : activeHeroImageIndex === 1 ? 'Back' : `Angle ${activeHeroImageIndex + 1}`}
                      </span>
                    )}
                    <div className="bg-primary-container/95 backdrop-blur-md text-white px-3 py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary-fixed">verified</span>
                      <span>{heroProduct.material || 'Cotton'}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Angle Thumbnails Strip */}
                {heroImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {heroImages.map((img, idx) => {
                      const isSelected = activeHeroImageIndex === idx;
                      const label = idx === 0 ? 'Front View' : idx === 1 ? 'Back Side' : idx === 2 ? 'Detail / Texture' : `Angle ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveHeroImageIndex(idx)}
                          className={`relative h-16 w-20 sm:h-18 sm:w-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${isSelected
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
              </div>

              {/* Specs, Live Dimensions & Rate Matrix */}
              <div className="w-full lg:w-1/2 space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                      MILL-DIRECT SPECIFICATION
                    </span>
                    <span className="bg-surface-container text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-md font-bold border border-outline-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">receipt_long</span> 5% GST COMPLIANT
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold mt-1.5 tracking-tight">
                    {heroProduct.title || heroProduct.name}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                    {heroProduct.subtitle || heroProduct.description}
                  </p>
                </div>

                {/* Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-surface-container-low p-2.5 rounded-xl text-center border border-border-subtle">
                    <span className="block font-label-sm text-label-sm text-outline font-semibold">MATERIAL</span>
                    <span className="font-title-md text-title-md text-primary font-bold">{heroProduct.material || 'Cotton'}</span>
                  </div>
                  <div className="bg-surface-container-low p-2.5 rounded-xl text-center border border-border-subtle">
                    <span className="block font-label-sm text-label-sm text-outline font-semibold">WEAVE</span>
                    <span className="font-title-md text-title-md text-primary font-bold">{heroProduct.weaveType || '20s'}</span>
                  </div>
                </div>

                {/* Dynamic Towel Dimensions List Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider block">
                      Direct Mill Sizes &amp; Rates ({heroProduct.sizes ? heroProduct.sizes.length : 0} options):
                    </span>
                    <span className="text-[11px] font-semibold text-secondary">
                      Standard MOQ: 40 pcs / size
                    </span>
                  </div>

                  {matchedHeroSize && (
                    <div className="bg-[#E6F5F0] border border-secondary-fixed p-3 rounded-xl flex items-center justify-between animate-in fade-in duration-150">
                      <div>
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Filtered Dimension:</span>
                        <span className="font-bold text-primary text-body-md">{matchedHeroSize.dimension || `${matchedHeroSize.size} cm`}</span>
                        <span className="text-xs text-on-surface-variant font-medium ml-1.5">
                          ({matchedHeroSize.inches || ''} • {matchedHeroSize.gsm || ''} GSM • {matchedHeroSize.grams || ''}g)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary font-mono text-title-md block">₹{matchedHeroSize.price}/pc</span>
                        <span className="text-[11px] text-secondary font-bold uppercase">MOQ: {matchedHeroSize.moq || 40} pcs</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(heroProduct.sizes || []).slice(0, 4).map((size, idx) => {
                      const sDim = (size.dimension || size.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
                      const isSelected = normalizedQuery && sDim.includes(normalizedQuery);

                      return (
                        <div
                          key={size.id || size._id || idx}
                          onClick={() => setSearchQuery(size.dimension || `${size.size} cm`)}
                          className={`p-3 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${isSelected
                            ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                            : 'border-outline-variant bg-surface-container-low hover:border-primary/40'
                            }`}
                        >
                          <div>
                            <span className={`font-bold block leading-tight text-body-sm ${isSelected ? 'text-white' : 'text-primary'}`}>
                              {size.dimension || `${size.size} cm`}
                            </span>
                            {size.inches && (
                              <span className={`text-[11px] font-medium ${isSelected ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                                {size.inches}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`font-bold font-mono block text-body-md ${isSelected ? 'text-secondary-fixed' : 'text-primary'}`}>
                              ₹{size.price}/pc
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-secondary-fixed' : 'text-secondary'}`}>
                              MOQ: {size.moq || 40} pcs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Mill Pricing Notice & Action */}
                <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-body-sm text-on-surface-variant">
                      {matchedHeroSize ? `Rate for ${matchedHeroSize.dimension}: ` : 'Direct Mill Rate: '}
                    </span>
                    <span className="font-bold text-primary text-body-md font-mono">
                      {matchedHeroSize ? (
                        <>₹{matchedHeroSize.price}/pc</>
                      ) : (
                        `₹${Math.min(...(heroProduct.sizes || []).map(s => s.price || 60))} - ₹${Math.max(...(heroProduct.sizes || []).map(s => s.price || 480))}/pc`
                      )}
                    </span>
                    <span className="block text-[11px] text-outline">Ex-factory Erode looms • Standard 40 pcs MOQ</span>
                  </div>
                  <Link
                    to={matchedHeroSize ? `/products/${heroProductId}?size=${matchedHeroSize.id || matchedHeroSize._id}` : `/products/${heroProductId}`}
                    className="bg-primary-container text-white px-5 py-2.5 rounded-xl font-label-md font-bold hover:bg-primary transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                  >
                    <span>{matchedHeroSize ? `Configure ${matchedHeroSize.dimension}` : 'Configure Order'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Catalog Section */}
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 className="text-headline-sm font-bold text-primary tracking-tight">Wholesale Towel Catalog</h2>
            <p className="text-body-sm text-on-surface-variant">
              Showing {filteredProducts.length} of {activeProducts.length} product lines available for direct mill supply
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilterId('all');
              }}
              className="text-label-sm font-bold text-secondary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Reset filter</span>
              <span className="material-symbols-outlined text-sm">restart_alt</span>
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
            <h3 className="text-title-md font-bold text-primary">No matching towels found</h3>
            <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
              We couldn't find any products matching "{searchQuery}". Try searching for specific dimensions like 70×140 or 30×60.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-primary-container text-white px-4 py-2 rounded-lg font-label-sm font-bold hover:bg-primary transition-colors"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                selectedDimension={searchQuery}
                onSelectDimension={(dim) => setSearchQuery(dim)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Institutional Trust & Capabilities Grid */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant flex flex-col justify-between hover:shadow-sm hover:border-primary/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">factory</span>
              </div>
              <h4 className="font-bold text-primary text-body-md">Direct Loom Pricing</h4>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Zero middleman markups. Genuine direct mill rates ex-factory from Tamil Nadu powerlooms.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant flex flex-col justify-between hover:shadow-sm hover:border-primary/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">wash</span>
              </div>
              <h4 className="font-bold text-primary text-body-md">Commercial Durability</h4>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Tested for 150+ commercial laundry wash cycles with heavy-duty institutional durability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Wholesale & Buyer Assistance Banner */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & Information */}
            <div className="lg:col-span-7 space-y-3 text-left">
              <div className="inline-flex items-center gap-1.5 text-secondary text-label-sm font-bold uppercase tracking-wider bg-secondary-container/30 px-3 py-1 rounded-full border border-secondary-fixed/40">
                <span className="material-symbols-outlined text-base">support_agent</span>
                Direct Mill Sales &amp; Inquiries
              </div>
              <h3 className="text-headline-md font-bold text-primary tracking-tight">
                Looking for Bulk Wholesale Supply or Custom Sizes?
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Connect directly with our weaving desk for factory-direct quotes, custom towel dimensions, and priority dispatch assistance.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-label-sm text-on-surface-variant font-semibold">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-secondary text-lg">verified</span>
                  Direct Factory Rates
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-secondary text-lg">local_shipping</span>
                  Daily Lorry Dispatch
                </span>
              </div>
            </div>

            {/* Right Column: Vertically Stacked Contact Options */}
            <div className="lg:col-span-5 flex flex-col gap-3 w-full">
              {/* Primary WhatsApp Action */}
              <a
                href={`https://api.whatsapp.com/send?phone=${activeWhatsappNumber}&text=${encodeURIComponent(`Hello ${millName}, I would like to inquire about wholesale towel pricing.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-secondary text-white px-5 py-3 rounded-xl font-label-md font-bold hover:bg-[#00513e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                title="Chat with Admin on WhatsApp"
              >
                <span className="material-symbols-outlined text-xl">chat</span>
                <span>WhatsApp Inquiry</span>
              </a>

              {/* Stacked Vertical Contact Numbers */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-outline uppercase tracking-wider px-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-secondary">phone_in_talk</span>
                  <span>Direct Desk Hotlines</span>
                </div>
                {millPhoneList.map((phone, idx) => {
                  const rawDigits = phone.replace(/\D/g, '');
                  const tenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
                  const cleanTel = `+91${tenDigits}`;
                  const whatsappDigits = `91${tenDigits}`;
                  const formattedDisplay = `+91 ${tenDigits}`;

                  return (
                    <div
                      key={idx}
                      className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 px-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
                    >
                      {/* Left: Call Link */}
                      <a
                        href={`tel:${cleanTel}`}
                        className="flex items-center gap-2.5 text-primary hover:text-secondary font-bold text-body-sm transition-colors flex-1"
                        title={`Click to Call: ${formattedDisplay}`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-secondary-container/30 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-lg">call</span>
                        </span>
                        <div className="text-left">
                          <span className="block leading-tight text-primary font-bold text-label-md">{formattedDisplay}</span>
                          <span className="text-[11px] text-outline font-normal">Click to call</span>
                        </div>
                      </a>

                      {/* Right: Message / WhatsApp Link */}
                      <a
                        href={`https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(`Hello, I would like to inquire about wholesale towel supply.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#E6F5F0] hover:bg-[#d5ede4] text-secondary font-bold text-label-sm active:scale-95 transition-all flex items-center gap-1 shrink-0 border border-secondary-fixed/50"
                        title={`Send WhatsApp message to ${formattedDisplay}`}
                        aria-label={`WhatsApp ${formattedDisplay}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>Chat</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Spotlight Image Lightbox Modal */}
      {heroProduct && (
        <ImageLightboxModal
          isOpen={spotlightLightboxOpen}
          onClose={() => setSpotlightLightboxOpen(false)}
          images={heroImages}
          initialIndex={activeHeroImageIndex}
          imageAlt={heroProduct.title || heroProduct.name}
          title={heroProduct.title || heroProduct.name}
          subtitle={`${heroProduct.material || 'Cotton'} • ${heroProduct.weaveType || '20s'} • Loom Spotlight Multi-Angle High-Res`}
        />
      )}
    </div>
  );
};
