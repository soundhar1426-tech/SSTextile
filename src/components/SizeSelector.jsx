import React from 'react';

export const SizeSelector = ({ sizes = [], selectedSize, onSelectSize }) => {

  if (!sizes || sizes.length === 0) {
    return (
      <div className="bg-surface-container-low p-4 rounded-xl text-center border border-outline-variant">
        <p className="text-body-sm text-on-surface-variant">No sizes currently configured for this towel SKU.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" id="size-cards-container">
      {sizes.map((size, index) => {
        const sizeId = size.id || size._id || index;
        const isSelected = selectedSize && (selectedSize.id === size.id || selectedSize._id === size._id);
        const isOutOfStock = size.stock === 0;
        const isLowStock = size.stock > 0 && size.stock <= 10;

        return (
          <article
            key={sizeId}
            onClick={() => onSelectSize(size)}
            className={`cursor-pointer rounded-xl p-3 flex flex-col gap-2 transition-all relative ${
              isOutOfStock
                ? 'bg-surface-container-low/60 border-2 border-outline-variant hover:border-outline'
                : 'bg-surface-container-lowest border-2'
            } ${
              isSelected
                ? 'border-primary-container shadow-sm ring-1 ring-primary-container/20'
                : isOutOfStock
                ? 'border-outline-variant'
                : 'border-outline-variant hover:border-outline'
            }`}
          >
            {/* Header: Dimension & Base Rate */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-metric-display text-metric-display leading-tight ${isOutOfStock ? 'text-outline' : 'text-primary'}`}>
                    {size.dimension || `${size.size} cm`}
                  </span>
                  {size.inches && (
                    <span className="font-label-sm text-label-sm text-outline">
                      ({size.inches})
                    </span>
                  )}
                  {size.isPopular && (
                    <span className="inline-flex items-center gap-1 bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      <span className="material-symbols-outlined text-[10px] material-symbols-filled">star</span>
                      <span>POPULAR B2B CHOICE</span>
                    </span>
                  )}
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium block mt-0.5">
                  {size.grams ? `${size.grams}g (Weight) • ` : size.weightKg ? `${Math.round(size.weightKg * 1000)}g (Weight) • ` : ''}Cotton
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className={`font-headline-sm text-headline-sm block leading-tight ${isOutOfStock ? 'text-outline' : 'text-primary'}`}>
                  ₹{size.price}<span className="text-label-sm text-outline font-normal">/pc</span>
                </span>
                <span
                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full inline-block font-bold mt-1 ${
                    isOutOfStock
                      ? 'bg-error-container text-on-error-container'
                      : size.stock < 40
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isLowStock
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-[#E6F5F0] text-secondary'
                  }`}
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : size.stock < 40
                    ? `Insufficient Stock (${size.stock} left • Min 40)`
                    : isLowStock
                    ? `Low Stock (${size.stock} left)`
                    : `${size.stock} pcs available`}
                </span>
              </div>
            </div>

            {/* Footer: MOQ & Mill Direct Rate */}
            <div className="flex flex-wrap items-center justify-between border-t border-border-subtle pt-2 gap-1 text-label-sm">
              <span className="bg-[#EFECE6] text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded border border-[#D5CFC5]">
                MOQ: {size.moq || 40} pcs
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Direct Mill Bulk Rate
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
};

