import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageLightboxModal } from './ImageLightboxModal';

const DEFAULT_TOWEL_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw';

export const ProductCard = ({ product, selectedDimension, onSelectDimension }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [cardImgIndex, setCardImgIndex] = useState(0);

  if (!product) return null;
  const sizes = product.sizes || [];
  const validPrices = sizes.map((s) => s.price ?? s.pricePerPiece).filter((p) => typeof p === 'number' && !isNaN(p));
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : (product.minPrice || 0);
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : (product.maxPrice || 0);
  const totalStock = sizes.length > 0 ? sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0) : (product.totalStock || 0);

  const productId = product.id || product._id;
  const productTitle = product.title || product.name || 'White Towel';

  const productImages = (product.images && product.images.length > 0)
    ? product.images.filter(Boolean)
    : [product.image || DEFAULT_TOWEL_IMAGE];

  const currentImage = productImages[cardImgIndex] || productImages[0] || DEFAULT_TOWEL_IMAGE;
  const rawMaterial = product.material || 'Cotton';
  const productMaterial = /cotton/i.test(rawMaterial) ? 'Cotton' : rawMaterial;
  const productSubtitle = product.subtitle || product.description || 'Premium institutional grade white terry towel for commercial use.';
  const productStatus = product.status && !product.status.toLowerCase().includes('out of stock')
    ? product.status
    : 'READY TO DISPATCH';
  const weaveDisplay = product.weaveType ? product.weaveType.split(' ')[0] : '20s';

  // Check if a specific dimension is currently selected/filtered
  const normalizedSelected = (selectedDimension || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
  const matchedSize = normalizedSelected
    ? sizes.find((s) => {
        const sDim = (s.dimension || s.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
        const sId = (s.id || s._id || '').toLowerCase();
        return sDim.includes(normalizedSelected) || sId.includes(normalizedSelected);
      })
    : null;

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  return (
    <>
      <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
        <div className="space-y-3">
          {/* Product Image (Full Width) with Angle Switcher & Badges */}
          <div
            onClick={handleImageClick}
            className="relative w-full h-60 sm:h-64 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant flex items-center justify-center cursor-pointer group/img shadow-2xs"
            title="Click to view full photo gallery"
          >
            <img
              src={currentImage}
              alt={productTitle}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_TOWEL_IMAGE;
              }}
              loading="lazy"
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 ease-out"
            />

            {/* Quick Angle Switcher if multiple images */}
            {productImages.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg z-10"
              >
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCardImgIndex(idx)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                      cardImgIndex === idx
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {idx === 0 ? 'Front' : idx === 1 ? 'Back' : `P${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Zoom / Full Photo Action Pill */}
            <div className="absolute top-2.5 right-2.5 bg-black/65 hover:bg-black/85 text-white px-2 py-1 rounded-md text-[11px] font-semibold opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 shadow-sm backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px]">zoom_in</span>
              <span>{productImages.length > 1 ? `${productImages.length} Photos` : 'Full Photo'}</span>
            </div>

            {/* Live Inventory Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-outline-variant shadow-xs">
              <span className="w-2 h-2 rounded-full bg-secondary pulse-live"></span>
              <span className="font-label-sm text-label-sm font-bold uppercase text-secondary">
                {productStatus}
              </span>
            </div>

            <div className="absolute bottom-2.5 right-2.5 bg-primary-container/90 backdrop-blur-sm text-surface-container-lowest px-2.5 py-1 rounded-md font-label-sm text-label-sm flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary-fixed">verified</span>
              <span>{productMaterial}</span>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">
                {productTitle}
              </h3>
              <span className="bg-[#F1F5F9] text-primary font-label-sm text-label-sm px-2 py-0.5 rounded font-bold border border-outline-variant shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">receipt</span> GST 5%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              {productSubtitle}
            </p>
          </div>

          {/* Filtered Dimension Card Banner if specific size selected */}
          {matchedSize && (
            <div className="bg-[#E6F5F0] border border-secondary-fixed p-2.5 rounded-xl flex items-center justify-between animate-in fade-in duration-150">
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Matching Dimension:</span>
                <span className="font-bold text-primary text-body-sm">{matchedSize.dimension || `${matchedSize.size} cm`}</span>
                {matchedSize.inches && (
                  <span className="text-[11px] text-on-surface-variant font-medium ml-1">({matchedSize.inches})</span>
                )}
              </div>
              <div className="text-right">
                <span className="font-bold text-primary font-mono text-body-md block">₹{matchedSize.price}/pc</span>
                <span className="text-[10px] text-secondary font-bold uppercase">MOQ: {matchedSize.moq || 40} pcs</span>
              </div>
            </div>
          )}

          {/* Dynamic Sizes Available Pills */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-label-sm text-outline font-bold uppercase tracking-wider block">
                Configurable Sizes ({sizes.length}):
              </span>
              <span className="text-[11px] text-outline font-medium">Click size to preview</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {sizes.map((size, idx) => {
                const sDim = (size.dimension || size.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
                const isSelected = normalizedSelected && sDim.includes(normalizedSelected);

                return (
                  <button
                    key={size.id || size._id || idx}
                    type="button"
                    onClick={() => onSelectDimension && onSelectDimension(size.dimension || `${size.size} cm`)}
                    className={`px-2.5 py-1 rounded-lg text-label-sm font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs font-bold ring-1 ring-primary/40'
                        : 'bg-surface-container-low border-border-subtle text-primary hover:border-primary/40'
                    }`}
                    title={`Click to filter ${size.dimension || size.size} cm (₹${size.price}/pc)`}
                  >
                    <span>{size.dimension || `${size.size} cm`}</span>
                    <span className={`font-mono font-bold ${isSelected ? 'text-secondary-fixed' : 'text-secondary'}`}>
                      ₹{size.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border-subtle">
            <div className="bg-surface-container-low p-1.5 rounded text-center border border-border-subtle">
              <span className="block font-label-sm text-label-sm text-outline">MATERIAL</span>
              <span className="font-title-md text-title-md text-primary font-bold">{productMaterial}</span>
            </div>
            <div className="bg-surface-container-low p-1.5 rounded text-center border border-border-subtle">
              <span className="block font-label-sm text-label-sm text-outline">WEAVE</span>
              <span className="font-title-md text-title-md text-primary font-bold">{weaveDisplay}</span>
            </div>
            <div className="bg-surface-container-low p-1.5 rounded text-center border border-border-subtle">
              <span className="block font-label-sm text-label-sm text-outline">STOCK</span>
              <span className="font-title-md text-title-md text-secondary font-bold">{totalStock} pcs</span>
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-label-sm text-outline block">
              {matchedSize ? `Rate (${matchedSize.dimension}):` : 'Wholesale Range:'}
            </span>
            <span className="text-title-md font-bold text-primary font-mono">
              {matchedSize ? (
                <>₹{matchedSize.price}<span className="text-label-sm text-outline font-normal">/pc</span></>
              ) : minPrice === maxPrice ? (
                `₹${minPrice}`
              ) : (
                `₹${minPrice} - ₹${maxPrice}`
              )}
              {!matchedSize && <span className="text-label-sm text-outline font-normal">/pc</span>}
            </span>
          </div>

          <Link
            to={matchedSize ? `/products/${productId}?size=${matchedSize.id || matchedSize._id}` : `/products/${productId}`}
            className="bg-primary-container hover:bg-primary text-white px-3.5 py-2 rounded-lg font-label-md font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <span>{matchedSize ? `Order ${matchedSize.dimension}` : 'Configure Order'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </article>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={productImages}
        initialIndex={cardImgIndex}
        imageAlt={productTitle}
        title={productTitle}
        subtitle={`${productMaterial} • ${weaveDisplay} • Direct Mill Photo`}
      />
    </>
  );
};

export default ProductCard;
