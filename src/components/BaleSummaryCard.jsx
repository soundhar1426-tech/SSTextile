import React from 'react';

export const BaleSummaryCard = ({ selectedSize, quantity }) => {
  if (!selectedSize) return null;

  const unitRate = Number(selectedSize.price || 0);
  const totalWeightKg = Number(((selectedSize.weightKg || 0.1) * quantity).toFixed(2));
  const estimatedBales = Math.max(1, Math.ceil(totalWeightKg / 20));

  return (
    <div className="bg-[#FAF9F7] rounded-lg p-3 border border-border-subtle flex flex-col gap-2">
      <div className="flex justify-between items-center text-body-sm font-body-sm">
        <span className="text-on-surface-variant">Standard Unit Rate:</span>
        <span className="font-bold text-primary font-mono">
          ₹{unitRate.toFixed(2)}/pc
        </span>
      </div>

      <div className="flex justify-between items-center text-body-sm font-body-sm">
        <span className="text-on-surface-variant">Approximate Weight:</span>
        <span className="font-semibold text-primary font-mono">
          {totalWeightKg} KG
        </span>
      </div>

      <div className="flex justify-between items-center text-body-sm font-body-sm">
        <span className="text-on-surface-variant">Packaging Spec:</span>
        <span className="text-on-surface font-medium">Standard Export Packing</span>
      </div>
    </div>
  );
};
