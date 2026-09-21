import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { initialProducts, millInfo } from '../data/mockData';

const ProductContext = createContext();

const getInitialMillSettings = () => {
  try {
    const saved = localStorage.getItem('gtex_mill_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.name && parsed.name.toLowerCase().includes('gowtham')) {
        localStorage.removeItem('gtex_mill_settings');
        return millInfo;
      }
      return { ...millInfo, ...parsed };
    }
  } catch (e) {
    console.warn('[ProductContext] Error parsing saved mill settings:', e);
  }
  return millInfo;
};

export const deduplicateCatalog = (rawProducts) => {
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) return initialProducts || [];
  const productMap = new Map();

  rawProducts.forEach((prod) => {
    if (!prod) return;
    const pKey = String(prod._id || prod.id || prod.name || Math.random()).trim();

    // Normalize sizes for this incoming product
    const sizeMap = new Map();
    const incomingSizes = Array.isArray(prod.sizes) && prod.sizes.length > 0
      ? prod.sizes
      : [{
          size: prod.size || '50x100',
          dimension: prod.dimension || (prod.size ? `${prod.size} cm` : '50x100 cm'),
          price: Number(prod.price ?? 220),
          stock: Number(prod.stock ?? 350),
          grams: Number(prod.grams ?? 300),
          gsm: Number(prod.gsm ?? 600),
          weightKg: Number(prod.weightKg ?? 0.3),
          active: prod.active !== false,
        }];

    incomingSizes.forEach((s) => {
      if (!s) return;
      const dimKey = String(s.size || s.dimension || '')
        .toLowerCase()
        .replace(/cm|inch|in/gi, '')
        .replace(/[×*X\-]/g, 'x')
        .replace(/\s+/g, '')
        .trim() || '50x100';

      const g = Number(s.grams) || Math.round(Number(s.weightKg || 0.3) * 1000) || Number(prod.grams || 300);
      const wKg = Number(s.weightKg) || Number((g / 1000).toFixed(3));
      const p = Number(s.price !== undefined ? s.price : (prod.price ?? 220));
      const stk = Number(s.stock !== undefined ? s.stock : (prod.stock ?? 350));
      const gsmVal = Number(s.gsm || prod.gsm || 600);

      sizeMap.set(dimKey, {
        ...s,
        id: s.id || s._id || `sz-${dimKey}`,
        _id: s._id || s.id || `sz-${dimKey}`,
        size: s.size || dimKey,
        dimension: s.dimension || `${dimKey} cm`,
        stock: stk,
        price: p,
        grams: g,
        gsm: gsmVal,
        weightKg: wKg,
        active: s.active !== false,
      });
    });

    const uniqueSizes = Array.from(sizeMap.values()).sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    const firstSize = uniqueSizes[0] || {};

    const priceVal = prod.price !== undefined ? Number(prod.price) : Number(firstSize.price ?? 220);
    const stockVal = prod.stock !== undefined ? Number(prod.stock) : Number(firstSize.stock ?? 350);
    const dimVal = prod.dimension || firstSize.dimension || (firstSize.size ? `${firstSize.size} cm` : '50x100 cm');
    const sizeVal = prod.size || firstSize.size || dimVal.replace(/cm|inch|in/gi, '').replace(/[×*X\-]/g, 'x').replace(/\s+/g, '').trim() || '50x100';
    const gramsVal = prod.grams !== undefined ? Number(prod.grams) : Number(firstSize.grams ?? 300);
    const gsmVal = prod.gsm !== undefined ? Number(prod.gsm) : Number(firstSize.gsm ?? 600);
    const weightKgVal = Number((gramsVal / 1000).toFixed(3));

    productMap.set(pKey, {
      ...prod,
      id: prod.id || prod._id || pKey,
      _id: prod._id || prod.id || pKey,
      name: prod.name || prod.title || 'White Towel',
      title: prod.title || prod.name || 'White Towel',
      price: priceVal,
      stock: stockVal,
      dimension: dimVal,
      size: sizeVal,
      grams: gramsVal,
      gsm: gsmVal,
      weightKg: weightKgVal,
      sizes: uniqueSizes,
    });
  });

  return Array.from(productMap.values());
};

const getInitialProducts = () => {
  try {
    const saved = localStorage.getItem('gtex_catalog_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateCatalog(parsed);
      }
    }
  } catch (e) {}
  return deduplicateCatalog(initialProducts || []);
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(getInitialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);

  const [millSettings, setMillSettings] = useState(getInitialMillSettings);

  const saveProductsLocally = (newList) => {
    try {
      const deduplicated = deduplicateCatalog(newList);
      localStorage.setItem('gtex_catalog_products', JSON.stringify(deduplicated));
      return deduplicated;
    } catch (e) {
      return newList;
    }
  };

  /**
   * Fetch all active customer products and their dynamic sizes from MongoDB
   */
  const fetchProducts = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('gtex_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const endpoint = user?.role === 'admin' ? '/admin/products' : '/products';

      const response = await api.get(endpoint);
      if (response.data.success && Array.isArray(response.data.products) && response.data.products.length > 0) {
        setProducts(response.data.products);
        saveProductsLocally(response.data.products);
        setError(null);
        return;
      }
    } catch (err) {
      console.warn('[ProductContext] Backend fetch notice (using active catalog):', err.message);
    }

    // Ensure state always has products
    setProducts((prev) => {
      if (prev && prev.length > 0) return prev;
      const fallback = getInitialProducts();
      saveProductsLocally(fallback);
      return fallback;
    });
  }, []);

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  /**
   * Fetch single product by ID from MongoDB or active catalog
   */
  const getProductById = useCallback(async (productId) => {
    if (!productId) return { success: false, error: 'No product ID provided', status: 400 };

    const cleanId = String(productId).trim();

    // 1. Check current memory / local cache first for instant 0ms retrieval
    const currentList = (productsRef.current && productsRef.current.length > 0) ? productsRef.current : getInitialProducts();
    let localProduct = currentList.find(
      (p) =>
        String(p.id) === cleanId ||
        String(p._id) === cleanId ||
        (p.name && p.name.toLowerCase() === cleanId.toLowerCase()) ||
        (p.title && p.title.toLowerCase() === cleanId.toLowerCase())
    );

    // If localProduct has full sizes, return immediately
    if (localProduct && Array.isArray(localProduct.sizes) && localProduct.sizes.length > 0) {
      return { success: true, product: localProduct };
    }

    // 2. Try fetching from live backend with a fast timeout (2500ms)
    try {
      const response = await api.get(`/products/${cleanId}`, { timeout: 2500 });
      if (response.data?.success && response.data.product) {
        return { success: true, product: response.data.product };
      }
    } catch (err) {
      try {
        const adminRes = await api.get(`/admin/products/${cleanId}`, { timeout: 2500 });
        if (adminRes.data?.success && adminRes.data.product) {
          return { success: true, product: adminRes.data.product };
        }
      } catch (adminErr) {}
    }

    if (localProduct) {
      return { success: true, product: localProduct };
    }

    // 3. Fallback to first product in active catalog
    if (currentList.length > 0) {
      return { success: true, product: currentList[0] };
    }

    return { success: false, error: 'Product not found', status: 404 };
  }, []);

  /**
   * Fetch inventory summary metrics
   */
  const fetchInventorySummary = useCallback(async () => {
    try {
      const response = await api.get('/admin/products/inventory/summary');
      if (response.data.success && response.data.summary) {
        setInventorySummary(response.data.summary);
        return;
      }
    } catch (err) {
      // Calculate locally
      const currentList = products.length > 0 ? products : getInitialProducts();
      let totalStock = 0;
      let totalValue = 0;
      let activeSizesCount = 0;
      currentList.forEach((p) => {
        (p.sizes || []).forEach((s) => {
          totalStock += Number(s.stock || 0);
          totalValue += Number(s.stock || 0) * Number(s.price || 0);
          activeSizesCount++;
        });
      });
      setInventorySummary({
        totalProducts: currentList.length,
        totalActiveSizes: activeSizesCount,
        totalStockPieces: totalStock,
        totalInventoryValue: totalValue,
      });
    }
  }, [products]);

  /**
   * Fetch mill configurations from backend
   */
  const fetchMillSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success && response.data.settings) {
        const s = { ...response.data.settings };
        // Ensure legacy names or details are sanitized to SSTextiles
        if (!s.name || s.name.toLowerCase().includes('gowtham')) {
          s.name = millInfo.name;
          s.gstin = millInfo.gstin;
          s.phone = millInfo.phone;
          s.whatsapp = millInfo.whatsapp;
          s.address = millInfo.address;
          s.email = millInfo.email;
        }
        setMillSettings((prev) => {
          const merged = { ...millInfo, ...prev, ...s };
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
   * Create a new product
   */
  const createProduct = async (productData) => {
    const newId = `prod-${Date.now()}`;
    const formattedSizes = (productData.sizes || []).map((s, idx) => ({
      ...s,
      id: s.id || s._id || `sz-${Date.now()}-${idx}`,
      _id: s._id || s.id || `sz-${Date.now()}-${idx}`,
      dimension: s.dimension || `${s.size} cm`,
    }));

    const newProduct = {
      ...productData,
      id: newId,
      _id: newId,
      sizes: formattedSizes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Immediate local update
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      saveProductsLocally(updated);
      return updated;
    });

    try {
      const response = await api.post('/admin/products', productData);
      if (response.data.success && response.data.product) {
        const serverProduct = response.data.product;
        setProducts((prev) => {
          const replaced = prev.map((p) => (p.id === newId ? serverProduct : p));
          saveProductsLocally(replaced);
          return replaced;
        });
        return { success: true, product: serverProduct };
      }
    } catch (err) {
      console.warn('[ProductContext] Product created locally (backend sync notice):', err.message);
    }

    return { success: true, product: newProduct };
  };

  /**
   * Update an existing product
   */
  const updateProduct = async (productId, productData) => {
    // Immediate local update
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const pId = String(p._id || p.id);
        if (pId === String(productId)) {
          const mergedSizes = (productData.sizes || p.sizes || []).map((s, idx) => ({
            ...s,
            id: s.id || s._id || `sz-${Date.now()}-${idx}`,
            _id: s._id || s.id || `sz-${Date.now()}-${idx}`,
            dimension: s.dimension || `${s.size} cm`,
          }));
          return {
            ...p,
            ...productData,
            sizes: mergedSizes,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      saveProductsLocally(updated);
      return updated;
    });

    try {
      const response = await api.put(`/admin/products/${productId}`, productData);
      if (response.data.success && response.data.product) {
        const serverProduct = response.data.product;
        setProducts((prev) => {
          const syncList = prev.map((p) => (String(p._id || p.id) === String(productId) ? serverProduct : p));
          saveProductsLocally(syncList);
          return syncList;
        });
        return { success: true, product: serverProduct };
      }
    } catch (err) {
      console.warn('[ProductContext] Product updated locally (backend sync notice):', err.message);
    }

    const current = (products || []).find((p) => String(p._id || p.id) === String(productId));
    return { success: true, product: current || { id: productId, ...productData } };
  };

  /**
   * Soft-delete / deactivate product
   */
  const deleteProduct = async (productId) => {
    setProducts((prev) => {
      const filtered = prev.filter((p) => String(p._id || p.id) !== String(productId));
      saveProductsLocally(filtered);
      return filtered;
    });

    try {
      await api.delete(`/admin/products/${productId}`);
    } catch (err) {
      console.warn('[ProductContext] Product deleted locally (backend sync notice):', err.message);
    }

    return { success: true };
  };

  /**
   * Add a dynamic size to a product
   */
  const addSize = async (productId, sizeData) => {
    const newSize = {
      ...sizeData,
      id: sizeData.id || sizeData._id || `sz-${Date.now()}`,
      _id: sizeData._id || sizeData.id || `sz-${Date.now()}`,
      dimension: sizeData.dimension || `${sizeData.size} cm`,
    };

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (String(p._id || p.id) === String(productId)) {
          return {
            ...p,
            sizes: [...(p.sizes || []), newSize],
          };
        }
        return p;
      });
      saveProductsLocally(updated);
      return updated;
    });

    try {
      const response = await api.post(`/admin/products/${productId}/sizes`, sizeData);
      if (response.data.success && response.data.size) {
        return { success: true, size: response.data.size };
      }
    } catch (err) {
      console.warn('[ProductContext] Size added locally (backend sync notice):', err.message);
    }

    return { success: true, size: newSize };
  };

  /**
   * Update a dynamic size
   */
  const updateSize = async (productId, sizeId, updatedFields) => {
    const targetSizeId = sizeId || productId;

    setProducts((prev) => {
      const updated = prev.map((p) => {
        const hasSize = (p.sizes || []).some((s) => String(s._id || s.id) === String(targetSizeId));
        if (hasSize) {
          return {
            ...p,
            sizes: (p.sizes || []).map((s) =>
              String(s._id || s.id) === String(targetSizeId) ? { ...s, ...updatedFields } : s
            ),
          };
        }
        return p;
      });
      saveProductsLocally(updated);
      return updated;
    });

    try {
      const response = await api.put(`/admin/sizes/${targetSizeId}`, updatedFields);
      if (response.data.success && response.data.size) {
        return { success: true, size: response.data.size };
      }
    } catch (err) {
      console.warn('[ProductContext] Size updated locally (backend sync notice):', err.message);
    }

    return { success: true, size: updatedFields };
  };

  /**
   * Adjust stock of a size with delta (+20, -20, +50)
   */
  const adjustSizeStock = async (productId, sizeId, delta) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const hasSize = (p.sizes || []).some((s) => String(s._id || s.id) === String(sizeId));
        if (hasSize) {
          return {
            ...p,
            sizes: (p.sizes || []).map((s) => {
              if (String(s._id || s.id) === String(sizeId)) {
                const newStock = Math.max(0, Number(s.stock || 0) + delta);
                return {
                  ...s,
                  stock: newStock,
                  status: newStock > 0 ? (newStock >= 200 ? 'Optimal Stock' : 'In Stock') : 'Out of Stock',
                };
              }
              return s;
            }),
          };
        }
        return p;
      });
      saveProductsLocally(updated);
      return updated;
    });

    try {
      await api.put(`/admin/sizes/${sizeId}`, { delta });
    } catch (err) {
      console.warn('[ProductContext] Stock adjusted locally (backend sync notice):', err.message);
    }

    return { success: true };
  };

  /**
   * Deactivate / delete a dynamic size
   */
  const deleteSize = async (productId, sizeId) => {
    const targetId = sizeId || productId;

    setProducts((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        sizes: (p.sizes || []).filter((s) => String(s._id || s.id) !== String(targetId)),
      }));
      saveProductsLocally(updated);
      return updated;
    });

    try {
      await api.delete(`/admin/sizes/${targetId}`);
    } catch (err) {
      console.warn('[ProductContext] Size deleted locally (backend sync notice):', err.message);
    }

    return { success: true };
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

  /**
   * Automatically decrement stock for purchased items
   */
  const decrementPurchasedStock = useCallback((purchasedItems) => {
    if (!Array.isArray(purchasedItems) || purchasedItems.length === 0) return;

    setProducts((prevProducts) => {
      const updated = prevProducts.map((prod) => {
        const prodSizes = prod.sizes || [];
        const updatedSizes = prodSizes.map((sz) => {
          const szKey = String(sz.size || sz.dimension || '')
            .toLowerCase()
            .replace(/cm|inch|in/gi, '')
            .replace(/[×*X\-]/g, 'x')
            .replace(/\s+/g, '')
            .trim();

          const matchingPurchase = purchasedItems.find((pItem) => {
            const pKey = String(pItem.size || pItem.sizeId || '')
              .toLowerCase()
              .replace(/^sz-/, '')
              .replace(/cm|inch|in/gi, '')
              .replace(/[×*X\-]/g, 'x')
              .replace(/\s+/g, '')
              .trim();
            const idMatches = String(sz._id || sz.id) === String(pItem.sizeId || pItem.sizeRef);
            return idMatches || (pKey && pKey === szKey);
          });

          if (matchingPurchase) {
            const purchasedQty = Number(matchingPurchase.quantity) || 0;
            const remaining = Math.max(0, Number(sz.stock || 0) - purchasedQty);
            return {
              ...sz,
              stock: remaining,
              status: remaining > 0 ? (remaining >= 200 ? 'Optimal Stock' : 'In Stock') : 'Out of Stock',
            };
          }
          return sz;
        });

        return {
          ...prod,
          sizes: updatedSizes,
        };
      });

      saveProductsLocally(updated);
      return updated;
    });

    // Refresh from backend to sync final MongoDB inventory
    setTimeout(() => {
      fetchProducts();
      fetchInventorySummary();
    }, 600);
  }, [fetchProducts, fetchInventorySummary]);

  // Listen for global order created stock decrement events
  useEffect(() => {
    const handleStockDecrementEvent = (e) => {
      if (e.detail && Array.isArray(e.detail.items)) {
        decrementPurchasedStock(e.detail.items);
      }
    };
    window.addEventListener('sst_order_stock_decrement', handleStockDecrementEvent);
    return () => {
      window.removeEventListener('sst_order_stock_decrement', handleStockDecrementEvent);
    };
  }, [decrementPurchasedStock]);

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
        decrementPurchasedStock,
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
