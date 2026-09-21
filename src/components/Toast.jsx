import React from 'react';
import { useCart } from '../context/CartContext';

export const Toast = () => {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;

  const text = typeof toastMessage === 'string' ? toastMessage : toastMessage.text || '';
  const type = typeof toastMessage === 'object' && toastMessage.type ? toastMessage.type : 'info';

  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isSuccess = type === 'success';

  const iconName = isError ? 'error' : isWarning ? 'warning' : isSuccess ? 'check_circle' : 'info';

  const colorClasses = isError
    ? 'bg-[#B00020] text-white border-red-400'
    : isWarning
    ? 'bg-[#E65100] text-white border-amber-400'
    : isSuccess
    ? 'bg-[#006A4E] text-white border-emerald-300'
    : 'bg-primary-container text-white border-secondary-fixed';

  return (
    <div
      className={`fixed top-16 right-4 z-50 max-w-sm px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-2.5 transition-all animate-bounce ${colorClasses}`}
      role="alert"
    >
      <span className="material-symbols-outlined text-xl shrink-0">{iconName}</span>
      <span className="text-body-sm font-medium leading-snug">{text}</span>
    </div>
  );
};
