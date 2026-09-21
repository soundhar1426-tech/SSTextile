import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { millInfo } from '../data/mockData';

export const Footer = () => {
  const { millSettings } = useProducts();
  const { isAuthenticated, currentUser } = useAuth();
  const currentMill = millSettings || millInfo;

  const millName = currentMill?.name || millInfo.name || 'GOWTHAM TEX';
  const millTagline = currentMill?.tagline || millInfo.tagline || 'Whole Sale Hand Looms Cloth Manufacturer';
  const millAddress = currentMill?.address || millInfo.address || 'D/No. 1/144, Devanampalayam, VELLIRAVELI (P.O.), Kunnathur - 638 103. (Via) Tirupur Dt. Tamilnadu.';
  const millGstin = currentMill?.gstin || millInfo.gstin || '33BRWPV7711D1ZD';
  const millPan = currentMill?.pan || millInfo.pan || 'BRWPV7711D';
  const millEmail = currentMill?.email || millInfo.email || 'orders@gowthamtex.com';
  const rawPhone = currentMill?.phone || millInfo.phone || '80728 65362, 94890 40067, 95666 47834';

  const phoneList = rawPhone
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <footer className="bg-surface-container-low border-t border-outline-variant mt-12 pb-24 md:pb-12 text-on-surface print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Mill Brand & Manufacturing Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary-container text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {millName.charAt(0)}
              </div>
              <span className="text-headline-sm font-bold text-primary tracking-tight">{millName}</span>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              <strong className="text-primary font-semibold">{millTagline}</strong> — manufacturing  cotton white towels and commercial linens with direct powerloom dispatch.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed/40 text-on-secondary-fixed-variant text-label-sm font-bold border border-secondary-fixed">
              <span className="w-2 h-2 rounded-full bg-secondary pulse-live"></span>
              DIRECT LOOM DISPATCH • TAMIL NADU
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider">Wholesale Portal</h4>
            <ul className="space-y-2 text-body-sm text-on-surface-variant font-medium">
              <li><Link to="/" className="hover:text-primary transition-colors">Home Showcase</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Pure White Terry Catalog</Link></li>
              <li><Link to="/cart" className="hover:text-primary transition-colors">Shopping Cart</Link></li>
              <li><Link to="/orders" className="hover:text-primary transition-colors">My Orders &amp; Tax Invoices</Link></li>
              <li>
                <Link to={isAuthenticated ? "/profile" : "/login"} className="hover:text-primary transition-colors">
                  {isAuthenticated ? "Buyer Profile & GST Account" : "Buyer Login & GST Account"}
                </Link>
              </li>
              {currentUser?.role === 'admin' ? (
                <li>
                  <Link to="/admin" className="hover:text-secondary text-primary font-bold transition-colors flex items-center gap-1 pt-1 border-t border-outline-variant/60">
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    <span>Admin Mill Portal</span>
                  </Link>
                </li>
              ) : (
                <li>
                  <Link to="/admin/login" className="hover:text-primary text-xs text-outline transition-colors flex items-center gap-1 pt-1">
                    <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                    <span>Admin Mill Login</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Technical & GST Compliance (Constant) */}
          <div className="space-y-3">
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider">Tax &amp; Specifications</h4>
            <ul className="space-y-1.5 text-body-sm text-on-surface-variant font-medium">
              <li><span className="font-bold text-primary">GSTIN:</span> <span className="font-mono text-xs font-bold text-primary">{millGstin}</span></li>
              <li><span className="font-bold text-primary">GST Rate:</span> 5% (2.5% CGST + 2.5% SGST)</li>
              <li><span className="font-bold text-primary">Packing:</span> Export Grade Bundle Packing</li>
            </ul>
          </div>

          {/* Col 4: Loom Mill Location & Direct Sales Hotlines (Constant Queries) */}
          <div className="space-y-3">
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider">Mill Location &amp; Inquiries</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              {millAddress}
            </p>
            <div className="pt-1 text-body-sm text-primary font-semibold flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Direct Desk Hotlines:</span>
                <span className="text-[10px] text-secondary font-bold">Mon–Sat 9AM–8PM</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {phoneList.map((phone, idx) => {
                  const rawDigits = phone.replace(/\D/g, '');
                  const tenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
                  const cleanTel = `+91${tenDigits}`;
                  const formattedDisplay = `+91 ${tenDigits}`;
                  const whatsappDigits = `91${tenDigits}`;

                  return (
                    <div key={idx} className="flex items-center justify-between bg-surface-container/80 px-2.5 py-1 rounded-lg border border-outline-variant/70">
                      <a
                        href={`tel:${cleanTel}`}
                        className="text-primary hover:text-secondary inline-flex items-center gap-1.5 transition-colors font-semibold text-xs"
                        title={`Click to Call: ${formattedDisplay}`}
                      >
                        <span className="material-symbols-outlined text-sm text-secondary">call</span>
                        <span>{formattedDisplay}</span>
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(`Hello ${millName}, I would like to inquire about wholesale towel supply.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:text-[#00513e] inline-flex items-center gap-0.5 text-[11px] font-bold pl-2 border-l border-outline-variant/60 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <span className="material-symbols-outlined text-xs">chat</span>
                        <span>Chat</span>
                      </a>
                    </div>
                  );
                })}
              </div>
              <div className="pt-1 text-[11px] text-on-surface-variant">
                <span>Email: </span>
                <a href={`mailto:${millEmail}`} className="text-primary hover:underline font-medium">
                  {millEmail}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee Ribbon */}
        <div className="pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between text-label-sm text-outline gap-2 text-center sm:text-left">
          <span>© {new Date().getFullYear()} {millName}. All Rights Reserved.</span>
          <span className="text-xs text-on-surface-variant font-medium">Official GST Tax Invoice • Daily Lorry Dispatch</span>
        </div>
      </div>
    </footer>
  );
};

