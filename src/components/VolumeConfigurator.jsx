import React from 'react';

export const VolumeConfigurator = ({
  selectedSize,
  quantity,
  onQuantityChange,
  minMoq = 40,
}) => {
  const minAllowed = 40;
  const maxStock = Number(selectedSize?.stock ?? 0);
  const isOutOfStock = maxStock === 0;
  const isStockBelowMoq = maxStock > 0 && maxStock < minAllowed;

  const handleAdjust = (delta) => {
    if (isOutOfStock || isStockBelowMoq) return;
    const currentVal = Number(quantity) || minAllowed;
    const nextVal = currentVal + delta;
    if (nextVal < minAllowed) {
      onQuantityChange(minAllowed);
    } else if (nextVal > maxStock) {
      onQuantityChange(maxStock);
    } else {
      onQuantityChange(nextVal);
    }
  };

  const handleManualInput = (e) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      onQuantityChange('');
      return;
    }
    const val = parseInt(rawVal, 10);
    onQuantityChange(isNaN(val) ? '' : val);
  };

  const handlePreset = (preset) => {
    if (preset > maxStock) {
      onQuantityChange(maxStock);
    } else {
      onQuantityChange(Math.max(minAllowed, preset));
    }
  };

  // Validation messages
  let validationMessage = null;
  let validationType = 'info';

  const numQty = Number(quantity);
  if (isOutOfStock) {
    validationMessage = 'This towel size is currently Out of Stock.';
    validationType = 'error';
  } else if (isStockBelowMoq) {
    validationMessage = `Minimum order is 40 pieces, but only ${maxStock} pieces are currently available.`;
    validationType = 'error';
  } else if (quantity !== '' && numQty < minAllowed) {
    validationMessage = 'Minimum order is 40 pieces. Please order at least 40 pieces.';
    validationType = 'error';
  } else if (quantity !== '' && numQty > maxStock) {
    validationMessage = `Only ${maxStock} pieces are available for this size.`;
    validationType = 'error';
  }

  return (
    <section className="bg-surface-container-lowest border border-contrast rounded-xl p-3.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
          <span className="font-title-md text-title-md text-primary font-bold">Volume Configuration</span>
        </div>
        <span className="bg-surface-container text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">
          Selected: {selectedSize?.dimension || `${selectedSize?.size} cm` || 'Towel Size'}
        </span>
      </div>

      {/* Stepper Controls & Manual Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider">
            ENTER QUANTITY (PIECES)
          </label>
          <span className="text-label-sm text-on-surface-variant font-medium">
            Min order: {minAllowed} pcs • Available: {maxStock} pcs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAdjust(-10)}
            disabled={isOutOfStock || isStockBelowMoq || numQty <= minAllowed}
            className="w-12 h-11 flex items-center justify-center bg-surface-container-low border border-outline-variant rounded-lg text-primary text-headline-sm font-headline-sm active:scale-95 transition-transform hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Decrease quantity by 10"
          >
            −
          </button>

          <div className="flex-1 relative">
            <input
              type="number"
              min={minAllowed}
              max={maxStock}
              step={10}
              value={quantity}
              onChange={handleManualInput}
              disabled={isOutOfStock || isStockBelowMoq}
              className={`w-full text-center font-metric-display text-metric-display text-primary h-11 border-2 rounded-lg focus:ring-0 outline-none tabular-nums ${
                validationType === 'error'
                  ? 'border-error bg-error-container/20 text-error'
                  : 'border-[#D5CFC5] focus:border-primary-container'
              } ${isOutOfStock || isStockBelowMoq ? 'bg-surface-container-low opacity-60 cursor-not-allowed' : ''}`}
            />
            <span className="absolute right-3 top-3 text-label-sm font-label-sm text-outline font-bold">
              PCS
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAdjust(10)}
            disabled={isOutOfStock || isStockBelowMoq || numQty >= maxStock}
            className="w-12 h-11 flex items-center justify-center bg-surface-container-low border border-outline-variant rounded-lg text-primary text-headline-sm font-headline-sm active:scale-95 transition-transform hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity by 10"
          >
            +
          </button>
        </div>

        {/* Validation Warning Alert */}
        {validationMessage && (
          <div
            className={`p-2.5 rounded-lg border text-label-sm flex items-start gap-1.5 ${
              validationType === 'error'
                ? 'bg-error-container/40 border-error/40 text-error font-medium'
                : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
              {validationType === 'error' ? 'error' : 'info'}
            </span>
            <span>{validationMessage}</span>
          </div>
        )}
      </div>

      {/* Instant Bale Presets */}
      {!isOutOfStock && !isStockBelowMoq && (
        <div className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-outline font-bold uppercase tracking-wider">
            QUICK VOLUME PRESETS
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[40, 80, 160, 300].map((preset) => {
              const isSelected = numQty === preset;
              const isExceedingStock = preset > maxStock;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  disabled={isExceedingStock}
                  className={`py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    isSelected
                      ? 'border-2 border-primary-container bg-primary-container text-surface-container-lowest font-bold shadow-sm'
                      : isExceedingStock
                      ? 'border border-outline-variant text-outline bg-surface-container-low opacity-40 cursor-not-allowed'
                      : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {preset} pcs
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
