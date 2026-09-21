import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { initialProducts, millInfo } from '../data/mockData';

const ProductContext = createContext();

const getInitialMillSettings = () => {
  try {
    const saved = localStorage.getItem('gtex_mill_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...millInfo, ...parsed };
    }
  } catch (e) {
    console.warn('[ProductContext] Error parsing saved mill settings:', e);
  }
  return millInfo;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);

  const [millSettings, setMillSettings] = useState(getInitialMillSettings);

  /**
   * Fetch all active customer products and their dynamic sizes from MongoDB
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem('gtex_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const endpoint = user?.role === 'admin' ? '/admin/products' : '/products';

      const response = await api.get(endpoint);
      if (response.data.success && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
        setError(null);
      }
    } catch (err) {
      // Fallback to public endpoint if admin endpoint fails (e.g. unauthenticated)
      try {
        const publicResponse = await api.get('/products');
        if (publicResponse.data.success && Array.isArray(publicResponse.data.products)) {
          setProducts(publicResponse.data.products);
          setError(null);
          return;
        }
      } catch (publicErr) {
        console.warn('[ProductContext] Public API fetch error:', publicErr.message);
      }
      console.warn('[ProductContext] Error fetching products from backend:', err.message);
      
      // Resilient fallback to initialProducts if backend is temporarily offline
      if (initialProducts && initialProducts.length > 0) {
        console.info('[ProductContext] Utilizing local catalog fallback.');
        setProducts(initialProducts);
        setError(null);
      } else {
        setError('Unable to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single product by ID from MongoDB public endpoint
   */
  const getProductById = useCallback(async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      if (response.data.success && response.data.product) {
        if (response.data.product.active === false || response.data.product.status === 'Inactive') {
          return { success: false, error: 'Product is inactive', status: 404 };
        }
        return { success: true, product: response.data.product };
      }
      return { success: false, error: 'Product not found', status: 404 };
    } catch (err) {
      // Resilient fallback to local catalog if offline
      const localProduct = initialProducts.find(
        (p) => (String(p.id) === String(productId) || String(p._id) === String(productId)) && p.active !== false && p.status !== 'Inactive'
      );
      if (localProduct) {
        return { success: true, product: localProduct };
      }
      const status = err.response?.status || 500;
      const message = status === 404
        ? 'Product not found'
        : 'Unable to load product details. Please try again.';
      return { success: false, error: message, status };
    }
  }, []);

  /**
   * Fetch inventory summary metrics from MongoDB
   */
  const fetchInventorySummary = useCallback(async () => {
    try {
      const response = await api.get('/admin/products/inventory/summary');
      if (response.data.success && response.data.summary) {
        setInventorySummary(response.data.summary);
      }
    } catch (err) {
      console.warn('[ProductContext] Error fetching inventory summary:', err.message);
    }
  }, []);

  /**
   * Fetch mill configurations from backend
   */
  const fetchMillSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success && response.data.settings) {
        const s = response.data.settings;
        setMillSettings((prev) => {
          const merged = { ...prev, ...s };
          try {
            localStorage.setItem('gtex_mill_settings', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('[ProductContext] Error fetching mill settings from backend:', err.message);
    }
  }, []);

  // Fetch initial products, inventory, and mill settings when mounted
  useEffect(() => {
    fetchProducts();
    fetchInventorySummary();
    fetchMillSettings();
  }, [fetchProducts, fetchInventorySummary, fetchMillSettings]);

  /**
   * Create a new product in MongoDB
   */
  const createProduct = async (productData) => {
    try {
      const response = await api.post('/admin/products', productData);
      if (response.data.success && response.data.product) {
        setProducts((prev) => [response.data.product, ...prev]);
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true, product: response.data.product };
      }
      return { success: false, error: response.data.message || 'Failed to create product' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create product';
      return { success: false, error: msg };
    }
  };

  /**
   * Update an existing product in MongoDB
   */
  const updateProduct = async (productId, productData) => {
    try {
      const response = await api.put(`/admin/products/${productId}`, productData);
      if (response.data.success && response.data.product) {
        const updated = response.data.product;
        // Immediate local state update
        setProducts((prev) =>
          prev.map((p) => {
            const pId = String(p._id || p.id);
            if (pId === String(productId)) {
              return updated;
            }
            return p;
          })
        );
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true, product: updated };
      }
      return { success: false, error: response.data.message || 'Failed to update product' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update product';
      return { success: false, error: msg };
    }
  };

  /**
   * Soft-delete / deactivate product in MongoDB
   */
  const deleteProduct = async (productId) => {
    try {
      const response = await api.delete(`/admin/products/${productId}`);
      if (response.data.success) {
        setProducts((prev) =>
          prev.filter((p) => String(p._id || p.id) !== String(productId))
        );
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Failed to delete product' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product';
      return { success: false, error: msg };
    }
  };

  /**
   * Add a dynamic size to a product in MongoDB
   */
  const addSize = async (productId, sizeData) => {
    try {
      const response = await api.post(`/admin/products/${productId}/sizes`, sizeData);
      if (response.data.success) {
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true, size: response.data.size };
      }
      return { success: false, error: response.data.message || 'Failed to add size' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add size';
      return { success: false, error: msg };
    }
  };

  /**
   * Update a dynamic size in MongoDB
   */
  const updateSize = async (productId, sizeId, updatedFields) => {
    try {
      const targetSizeId = sizeId || productId;
      const response = await api.put(`/admin/sizes/${targetSizeId}`, updatedFields);
      if (response.data.success) {
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true, size: response.data.size };
      }
      return { success: false, error: response.data.message || 'Failed to update size' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update size';
      return { success: false, error: msg };
    }
  };

  /**
   * Adjust stock of a size with delta (+20, -20, +50) in MongoDB
   */
  const adjustSizeStock = async (productId, sizeId, delta) => {
    try {
      const response = await api.put(`/admin/sizes/${sizeId}`, { delta });
      if (response.data.success) {
        // Optimistic UI update
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId && p._id !== productId) return p;
            return {
              ...p,
              sizes: (p.sizes || []).map((s) => {
                if (s.id !== sizeId && s._id !== sizeId) return s;
                const newStock = Math.max(0, s.stock + delta);
                return {
                  ...s,
                  stock: newStock,
                  status: newStock > 0 ? (newStock >= 200 ? 'Optimal Stock' : 'In Stock') : 'Out of Stock',
                };
              }),
            };
          })
        );
        fetchInventorySummary();
        return { success: true };
      }
    } catch (err) {
      console.error('[ProductContext] Error adjusting size stock:', err);
      fetchProducts();
    }
  };

  /**
   * Deactivate a dynamic size in MongoDB
   */
  const deleteSize = async (productId, sizeId) => {
    try {
      const targetId = sizeId || productId;
      const response = await api.delete(`/admin/sizes/${targetId}`);
      if (response.data.success) {
        await fetchProducts();
        await fetchInventorySummary();
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Failed to delete size' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete size';
      return { success: false, error: msg };
    }
  };

  // Mill Settings Management
  const updateMillSettings = async (newSettings) => {
    const updated = { ...millSettings, ...newSettings };
    setMillSettings(updated);
    try {
      localStorage.setItem('gtex_mill_settings', JSON.stringify(updated));
    } catch (e) {}

    // Persist to backend MongoDB
    try {
      const res = await api.put('/admin/settings', {
        millSettings: updated,
      });
      if (res.data.success && res.data.settings) {
        const s = res.data.settings;
        setMillSettings((prev) => ({ ...prev, ...s }));
        try {
          localStorage.setItem('gtex_mill_settings', JSON.stringify({ ...updated, ...s }));
        } catch (e) {}
        return { success: true, settings: s };
      }
    } catch (err) {
      console.warn('[ProductContext] Error saving mill settings to backend:', err.message);
    }
    return { success: true, settings: updated };
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        inventorySummary,
        fetchProducts,
        refreshProducts: fetchProducts,
        getProductById,
        fetchInventorySummary,
        createProduct,
        updateProduct,
        deleteProduct,
        addSize,
        updateSize,
        deleteSize,
        adjustSizeStock,
        millSettings,
        fetchMillSettings,
        updateMillSettings,
        addProduct: createProduct, // alias
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
export default ProductContext;
