import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Providers
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';

// Components
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';

// Customer Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Orders } from './pages/Orders';
import { OrderDetails } from './pages/OrderDetails';
import { Invoice } from './pages/Invoice';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Admin Pages
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { AdminProducts } from './admin/Products';
import { ProductForm } from './admin/ProductForm';
import { Inventory } from './admin/Inventory';
import { AdminOrders } from './admin/Orders';
import { AdminCustomers } from './admin/Customers';
import { AdminInvoices } from './admin/Invoices';
import { AdminSettings } from './admin/Settings';
import { AdminLogin } from './admin/AdminLogin';

import { FloatingTradeDesk } from './components/FloatingTradeDesk';

// Customer layout wrapper
const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between">
      <Navbar />
      <Toast />
      <div className="pt-14 flex-1">
        <Outlet />
      </div>
      <FloatingTradeDesk />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* Customer Public & Storefront Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer Protected Routes (Requires Customer Auth) */}
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoice/:id"
                    element={
                      <ProtectedRoute>
                        <Invoice />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Admin Authentication Route */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Protected Routes (Requires role: 'admin') */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="invoices" element={<AdminInvoices />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Fallback Route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Router>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
