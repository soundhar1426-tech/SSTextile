import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = () => {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const accountPath = isAuthenticated ? '/profile' : '/login';

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant px-2 shadow-sm md:hidden print:hidden">
      {/* Tab 1: Catalogue */}
      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            isActive ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled' : ''}`}>
              grid_view
            </span>
            <span className="text-label-sm font-label-sm mt-0.5">Catalogue</span>
          </>
        )}
      </NavLink>

      {/* Tab 2: Orders */}
      <NavLink
        to="/orders"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            isActive ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled' : ''}`}>
              receipt_long
            </span>
            <span className="text-label-sm font-label-sm mt-0.5">Orders</span>
          </>
        )}
      </NavLink>

      {/* Tab 3: Cart */}
      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 relative ${
            isActive ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled' : ''}`}>
                shopping_cart
              </span>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-secondary text-surface-container-lowest text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </div>
            <span className="text-label-sm font-label-sm mt-0.5">Cart</span>
          </>
        )}
      </NavLink>

      {/* Tab 4: Account / Profile */}
      <NavLink
        to={accountPath}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            isActive ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled' : ''}`}>
              account_circle
            </span>
            <span className="text-label-sm font-label-sm mt-0.5">{isAuthenticated ? 'Profile' : 'Account'}</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};
