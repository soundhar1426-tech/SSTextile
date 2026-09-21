import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { millInfo } from '../data/mockData';

export const AdminLayout = () => {
  const { isAdmin, currentUser, logoutAdmin } = useAuth();
  const { millSettings } = useProducts();
  const currentMill = millSettings || millInfo;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Route guard: Redirect customers to admin login if not authenticated
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard', end: true },
    { label: 'Towel Products', path: '/admin/products', icon: 'grid_view' },
    { label: 'Sizes & Inventory', path: '/admin/inventory', icon: 'straighten' },
    { label: 'Wholesale Orders', path: '/admin/orders', icon: 'receipt_long' },
    { label: 'Buyer Directory', path: '/admin/customers', icon: 'group' },
    { label: 'GST Invoices', path: '/admin/invoices', icon: 'receipt' },
    { label: 'Mill Settings', path: '/admin/settings', icon: 'settings' },
  ];

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Admin Top App Bar */}
      <header className="fixed top-0 left-0 w-full h-14 z-40 bg-surface border-b border-outline-variant px-4 flex items-center justify-between shadow-none print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex flex-col">
            <span className="text-headline-sm font-bold text-primary tracking-tight leading-none">
              {currentMill.name || 'SSTextiles'}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
              Admin Mill Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-secondary mr-1.5 pulse-live"></span>
            <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider font-bold">
              Live Hub
            </span>
          </div>

          <Link
            to="/"
            className="text-label-md font-bold text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            <span className="hidden sm:inline">Buyer Storefront</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-error hover:bg-error-container/40 transition-colors"
            title="Logout Admin"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="pt-14 flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-surface-container-lowest border-r border-outline-variant flex-col justify-between p-4 sticky top-14 h-[calc(100vh-3.5rem)] print:hidden">
          <div className="space-y-4">
            <div className="px-2 py-1">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                Mill Operations
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium transition-all ${isActive
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-outlined text-[20px] ${isActive ? 'material-symbols-filled' : ''}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2.5 text-label-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-primary text-xs truncate leading-tight">
                  {currentUser?.name || 'Mill Administrator'}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate font-mono">
                  {currentUser?.email || millSettings?.email || 'admin@sstextiles.com'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px]">
              <Link
                to="/admin/settings"
                className="text-secondary font-bold hover:underline flex items-center gap-1 transition-colors"
                title="Edit administrator name, login email, password, and mill details"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Edit Admin Details</span>
              </Link>
              <span className="bg-secondary-container/40 text-secondary border border-secondary/30 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
                ADMIN
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-surface-container-lowest h-full p-4 flex flex-col justify-between shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <span className="font-bold text-primary">Admin Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-outline hover:text-primary">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-body-md font-medium ${isActive
                          ? 'bg-primary text-white font-bold'
                          : 'text-on-surface-variant hover:bg-surface-container'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 bg-error-container text-on-error-container rounded-lg font-bold text-label-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Logout Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
