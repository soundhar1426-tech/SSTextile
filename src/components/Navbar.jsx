import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';

export const Navbar = () => {
  const { cartItems } = useCart();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { millSettings } = useProducts();
  const currentMill = millSettings || millInfo;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant px-4 flex items-center justify-between print:hidden">
        {/* Left: Menu & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors active:scale-95"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              {currentMill.name ? currentMill.name.charAt(0) : 'S'}
            </div>
            <div>
              <span className="text-headline-sm font-bold text-primary tracking-tight block leading-none">
                {currentMill.name || 'SSTextiles'}
              </span>
              <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block leading-tight">
                Wholesale Towels
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-body-sm font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary font-bold border-b-2 border-primary-container pb-0.5' : 'text-on-surface-variant'}`}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={`text-body-sm font-medium transition-colors hover:text-primary ${isActive('/products') ? 'text-primary font-bold border-b-2 border-primary-container pb-0.5' : 'text-on-surface-variant'}`}
          >
            Towel Catalog
          </Link>
          <Link
            to="/orders"
            className={`text-body-sm font-medium transition-colors hover:text-primary ${isActive('/orders') ? 'text-primary font-bold border-b-2 border-primary-container pb-0.5' : 'text-on-surface-variant'}`}
          >
            My Orders
          </Link>
          <Link
            to="/cart"
            className={`text-body-sm font-medium transition-colors hover:text-primary ${isActive('/cart') ? 'text-primary font-bold border-b-2 border-primary-container pb-0.5' : 'text-on-surface-variant'}`}
          >
            Cart ({cartItems.length})
          </Link>
        </nav>

        {/* Right: Cart + Buyer Account */}
        <div className="flex items-center gap-2 sm:gap-3">

          <Link
            to="/cart"
            className="relative p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors active:scale-95"
            aria-label="View Cart"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* User Account / Auth Actions */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors active:scale-95"
                title="Buyer Account Details"
              >
                <div className="w-7 h-7 rounded-full bg-secondary-fixed text-secondary font-bold text-xs flex items-center justify-center uppercase">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <span className="hidden lg:inline text-label-sm font-bold text-primary max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                <span className="material-symbols-outlined text-sm text-outline">expand_more</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-outline-variant">
                    <p className="text-body-sm font-bold text-primary truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{currentUser.email}</p>
                    {currentUser.gstin && (
                      <span className="mt-1 inline-block text-[10px] bg-secondary-container text-secondary px-1.5 py-0.5 rounded font-mono font-bold">
                        GST: {currentUser.gstin}
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                    <span>My Profile &amp; GST</span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>My Wholesale Orders</span>
                  </Link>

                  {currentUser.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-body-sm text-secondary font-semibold hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                      <span>Admin Mill Portal</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-error hover:bg-error-container/30 transition-colors text-left font-semibold"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-primary text-label-sm font-bold transition-all active:scale-95"
                title="Buyer Login"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-white text-label-sm font-bold shadow-xs transition-all active:scale-95"
                title="Register Wholesale B2B Account"
              >
                <span className="material-symbols-outlined text-[16px]">domain_verification</span>
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 bg-surface-container-lowest h-full p-4 flex flex-col justify-between shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary-container text-white flex items-center justify-center font-bold">
                    {currentMill.name ? currentMill.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <span className="font-bold text-primary block leading-none">{currentMill.name || 'SSTextiles'}</span>
                    <span className="text-[10px] text-secondary font-bold">{currentMill.tagline || 'Erode Weaving Mill'}</span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded text-outline hover:text-primary">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium text-primary hover:bg-surface-container">
                  <span className="material-symbols-outlined text-xl text-primary">home</span>
                  <span>Home</span>
                </Link>
                <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium text-primary hover:bg-surface-container">
                  <span className="material-symbols-outlined text-xl text-primary">grid_view</span>
                  <span>Towel Catalog</span>
                </Link>
                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-body-md font-medium text-primary hover:bg-surface-container">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">shopping_cart</span>
                    <span>Shopping Cart</span>
                  </div>
                  <span className="bg-secondary-container text-secondary text-label-sm px-2 py-0.5 rounded-full font-bold">{cartItems.length} items</span>
                </Link>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium text-primary hover:bg-surface-container">
                  <span className="material-symbols-outlined text-xl text-primary">receipt_long</span>
                  <span>My Orders</span>
                </Link>

                {isAuthenticated && currentUser ? (
                  <div className="pt-2 border-t border-outline-variant space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <p className="text-body-sm font-bold text-primary truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">{currentUser.email}</p>
                      </div>
                      <span className="text-xs font-bold text-secondary flex items-center gap-0.5">
                        <span>Edit</span>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-body-md font-medium text-primary hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-xl text-primary">manage_accounts</span>
                      <span>My Profile &amp; GST</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-body-md font-medium text-error hover:bg-error-container/30"
                    >
                      <span className="material-symbols-outlined text-xl">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-outline-variant space-y-2">
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider block px-1">
                      Wholesale Buyer Portal
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-primary text-label-md font-bold hover:bg-surface-container transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-base">login</span>
                        <span>Login</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary-container text-white rounded-xl text-label-md font-bold hover:bg-primary transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-base">domain_verification</span>
                        <span>Sign Up</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const rawPhone = currentMill.phone || '98765 43210, 98765 43211';
              const phoneList = rawPhone.split(',').map((p) => p.trim()).filter(Boolean);
              const primaryPhone = phoneList[0] || '98765 43210';
              const rawDigits = primaryPhone.replace(/\D/g, '');
              const cleanTel = primaryPhone.startsWith('+') ? primaryPhone.replace(/[^\d+]/g, '') : `+91${rawDigits.slice(-10)}`;

              const whatsappDigits = currentMill.whatsapp
                ? currentMill.whatsapp.split(',')[0].replace(/\D/g, '')
                : (rawDigits.length === 10 ? `91${rawDigits}` : (rawDigits.startsWith('91') ? rawDigits : `91${rawDigits.slice(-10)}`));

              return (
                <div className="bg-surface-container p-3 rounded-xl border border-outline-variant text-label-sm text-on-surface-variant space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary block">GSTIN: {currentMill.gstin || '33AAAAA0000A1Z5'}</span>
                    <span className="text-[10px] bg-secondary-fixed text-secondary px-2 py-0.5 rounded-full font-bold">5% GST</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
                    <div>
                      <span className="text-[11px] text-outline block">Direct Mill Desk</span>
                      <span className="font-bold text-primary text-xs">{rawPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cleanTel}`}
                        className="px-2.5 py-1.5 bg-white hover:bg-surface-container text-primary rounded-lg font-bold text-xs flex items-center gap-1 border border-outline-variant shadow-2xs active:scale-95 transition-all"
                        title="Call Mill Desk"
                      >
                        <span className="material-symbols-outlined text-[15px] text-secondary">call</span>
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(`Hello ${currentMill.name || 'SSTextiles'}, I would like to inquire about wholesale towel supply.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-secondary hover:bg-[#00513e] text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                        title="Chat on WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
