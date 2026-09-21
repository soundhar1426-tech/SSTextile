import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';

export const FloatingTradeDesk = () => {
  const { millSettings } = useProducts();
  const currentMill = millSettings || millInfo;
  const [isOpen, setIsOpen] = useState(false);

  const rawPhone = currentMill.phone || '95666 44564';
  const phoneList = rawPhone.split(',').map((p) => p.trim()).filter(Boolean);
  const primaryPhone = phoneList[0] || '95666 44564';

  const rawDigits = primaryPhone.replace(/\D/g, '');
  const cleanTel = primaryPhone.startsWith('+') ? primaryPhone.replace(/[^\d+]/g, '') : `+91${rawDigits.slice(-10)}`;
  const whatsappDigits = currentMill.whatsapp
    ? currentMill.whatsapp.split(',')[0].replace(/\D/g, '')
    : (rawDigits.length === 10 ? `91${rawDigits}` : (rawDigits.startsWith('91') && rawDigits.length === 12 ? rawDigits : `91${rawDigits.slice(-10)}`));

  const whatsappMsg = `Hello ${currentMill.name || 'SSTextiles'}, I would like to inquire about wholesale towel supply and direct loom pricing.`;

  return (
    <aside aria-label="Trade Desk Quick Contact" className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 select-none print:hidden">
      {/* Expanded Quick Action Popover */}
      {isOpen && (
        <div className="bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-2xl p-4 shadow-2xl w-72 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
            <div>
              <h4 className="font-bold text-primary text-sm leading-tight">{currentMill.name || 'SSTextiles'}</h4>
              <p className="text-[11px] text-on-surface-variant">Direct Mill Wholesale Desk</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-outline hover:text-primary rounded-lg"
              aria-label="Close trade desk"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* 1. Direct WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm active:scale-98 transition-all"
              title="Chat on WhatsApp"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>Chat on WhatsApp</span>
              </span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>

            {/* 2. Direct Call Hotline */}
            <a
              href={`tel:${cleanTel}`}
              className="w-full py-2.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs rounded-xl flex items-center justify-between border border-outline-variant active:scale-98 transition-all"
              title="Call Mill Phone"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">call</span>
                <span>Call {primaryPhone}</span>
              </span>
              <span className="material-symbols-outlined text-sm text-outline">call_made</span>
            </a>
          </div>

          <div className="text-[10px] text-outline text-center">
            Operating Mon–Sat 9AM–8.00PM IST • Tiruppur, TN
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 px-3.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs transition-all duration-300 active:scale-95 cursor-pointer ${isOpen
          ? 'bg-primary text-white shadow-primary/30'
          : 'bg-secondary hover:bg-[#00513e] text-white shadow-secondary/30 hover:scale-105'
          }`}
        title="Direct Mill Contact / WhatsApp & Call"
        aria-label="Direct Mill Contact"
      >
        <span className="material-symbols-outlined text-xl">
          {isOpen ? 'close' : 'support_agent'}
        </span>
        <span className="hidden sm:inline font-sans font-semibold">
          {isOpen ? 'Close' : 'Trade Desk • Call / WhatsApp'}
        </span>
      </button>
    </aside>
  );
};

export default FloatingTradeDesk;
