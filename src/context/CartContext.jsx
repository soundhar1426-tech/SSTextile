import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'gtex_cart';

export const CartProvider = ({ children }) => {

  // Load persisted cart from localStorage without hardcoded demo items
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('[CartContext] Failed to load cart from localStorage:', e);
    }
    return [];
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Synchronize cartItems state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('[CartContext] Failed to persist cart to localStorage:', e);
    }
  }, [cartItems]);

  // Clean up cart items if a product is deleted
  useEffect(() => {
    const handleProductDeleted = (e) => {
      const deletedId = e.detail?.productId;
      if (deletedId) {
        setCartItems((prev) =>
          prev.filter(
            (item) =>
              String(item.productId) !== String(deletedId) &&
              !String(item.cartItemId).startsWith(String(deletedId))
          )
        );
      }
    };
    window.addEventListener('sst_product_deleted', handleProductDeleted);
    return () => {
      window.removeEventListener('sst_product_deleted', handleProductDeleted);
    };
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Add dynamic size product to cart with strict MOQ (40 pcs) and stock validations
   */
  const addToCart = (product, selectedSize, quantity) => {
    if (!product || !selectedSize) {
      const errorMsg = 'Please select a towel size.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    if (product.active === false || product.status === 'Inactive') {
      const errorMsg = 'This product is currently inactive and unavailable.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const availableStock = Number(selectedSize.stock ?? 0);
    const sizeName = selectedSize.dimension || selectedSize.size || 'selected size';

    // Edge Case 1: Out of stock
    if (availableStock === 0) {
      const errorMsg = 'Out of Stock. This size is currently unavailable.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    // Edge Case 2: Stock is less than MOQ (40 pcs)
    if (availableStock < 40) {
      const errorMsg = `Minimum order is 40 pieces, but only ${availableStock} pieces are currently available.`;
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      const errorMsg = 'Please enter a valid quantity.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const productId = String(product.id || product._id);
    const sizeId = String(selectedSize.id || selectedSize._id);
    const cartItemId = `${productId}_${sizeId}`;

    const existingItem = cartItems.find((item) => item.cartItemId === cartItemId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const combinedQuantity = currentQtyInCart + parsedQty;

    // MOQ check: new items must be at least 40 pcs, combined quantity must be at least 40 pcs
    if (!existingItem && parsedQty < 40) {
      const errorMsg = 'Minimum order is 40 pieces. Please order at least 40 pieces.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    if (combinedQuantity < 40) {
      const errorMsg = 'Minimum order is 40 pieces. Please order at least 40 pieces.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    // Stock check: combined quantity must not exceed available stock
    if (combinedQuantity > availableStock) {
      const errorMsg = existingItem
        ? `Only ${availableStock} pieces are available for this size (${currentQtyInCart} already in cart).`
        : `Only ${availableStock} pieces are available for this size.`;
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...prevItems[existingIndex],
          quantity: combinedQuantity,
          price: Number(selectedSize.price),
          availableStock,
        };
        return updatedItems;
      }

      // Format clean B2B Cart Item
      const newCartItem = {
        cartItemId,
        productId,
        productName: product.title || product.name || 'White Towel',
        productTitle: product.title || product.name || 'White Towel',
        productImage: product.image || (product.images && product.images[0]) || '',
        image: product.image || (product.images && product.images[0]) || '',
        sizeId,
        size: selectedSize.size || (selectedSize.dimension ? selectedSize.dimension.replace(' cm', '').replace('×', 'x') : '25x50'),
        dimension: selectedSize.dimension || `${selectedSize.size} cm`,
        inches: selectedSize.inches || '',
        category: selectedSize.category || `${selectedSize.size || 'Towel'} Spec`,
        gsm: selectedSize.gsm || 500,
        price: Number(selectedSize.price),
        quantity: parsedQty,
        availableStock,
        weightKg: selectedSize.weightKg || 0.099,
        moq: 40,
      };

      return [...prevItems, newCartItem];
    });

    showToast(`Added ${parsedQty} pcs of ${sizeName} to Cart!`, 'success');
    return { success: true, message: `Added ${parsedQty} pcs to cart` };
  };

  /**
   * Update quantity with MOQ (40 pcs) and stock ceiling checks
   */
  const updateQuantity = (cartItemId, newQty) => {
    const targetItem = cartItems.find((item) => item.cartItemId === cartItemId);
    if (!targetItem) {
      return { success: false, error: 'Item not found in cart.' };
    }

    const parsedQty = parseInt(newQty, 10);
    const minMoq = targetItem.moq || 40;
    const maxStock = targetItem.availableStock ?? Infinity;

    if (isNaN(parsedQty) || parsedQty < minMoq) {
      const errorMsg = 'Minimum order quantity is 40 pieces.';
      showToast(errorMsg, 'warning');
      return { success: false, error: errorMsg };
    }

    if (parsedQty > maxStock) {
      const errorMsg = `Only ${maxStock} pieces are available.`;
      showToast(errorMsg, 'warning');
      return { success: false, error: errorMsg };
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: parsedQty } : item
      )
    );

    return { success: true };
  };

  /**
   * Remove item from cart and recalculate immediately
   */
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
    showToast('Item removed from cart', 'info');
    return { success: true };
  };

  /**
   * Clear all items in cart
   */
  const clearCart = () => {
    setCartItems([]);
    showToast('Cart cleared', 'info');
  };

  // Calculations without discounts
  const totalPieces = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const grossSubtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const rebatePercent = 0;
  const rebateAmount = 0;
  const activeTierLabel = '';
  const taxableValue = grossSubtotal;
  const gstAmount = Math.round(taxableValue * 0.05); // 5% GST
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const netPayable = taxableValue + gstAmount;

  const totalWeightKg = Number(
    cartItems
      .reduce((sum, item) => sum + (Number(item.weightKg) || 0.099) * (Number(item.quantity) || 0), 0)
      .toFixed(2)
  );
  const baleCount = Math.max(1, Math.ceil(totalPieces / 60));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPieces,
        grossSubtotal,
        cartSubtotal: grossSubtotal,
        rebatePercent,
        rebateAmount,
        activeTierLabel,
        taxableValue,
        gstAmount,
        cgstAmount,
        sgstAmount,
        netPayable,
        totalWeightKg,
        baleCount,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
