import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

export const AdminProducts = () => {
  const { products, loading, error, deleteProduct, updateProduct, fetchProducts } = useProducts();
  const [deleteError, setDeleteError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick HSN Edit Modal State
  const [editingHsnProduct, setEditingHsnProduct] = useState(null);
  const [quickHsnVal, setQuickHsnVal] = useState('');
  const [isSavingHsn, setIsSavingHsn] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId, productTitle) => {
    if (confirm(`Are you sure you want to permanently remove "${productTitle}" from the towel products list?`)) {
      setIsDeleting(true);
      setDeleteError('');
      const result = await deleteProduct(productId);
      setIsDeleting(false);
      if (!result.success) {
        setDeleteError(result.error || 'Failed to remove product');
      } else {
        setFeedbackMessage({
          type: 'success',
          text: `Product "${productTitle}" removed successfully.`,
        });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  const handleToggleActive = async (productId, currentActive) => {
    const res = await updateProduct(productId, { active: !currentActive });
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Product status updated to ${!currentActive ? 'Active (Live)' : 'Inactive (Draft)'}.`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      alert(`Failed to update status: ${res.error}`);
    }
  };

  const handleOpenHsnModal = (product) => {
    setEditingHsnProduct(product);
    setQuickHsnVal(product.hsnCode || '6302.60');
  };

  const handleSaveHsn = async (e) => {
    e.preventDefault();
    if (!editingHsnProduct) return;
    setIsSavingHsn(true);

    const pId = editingHsnProduct._id || editingHsnProduct.id;
    const res = await updateProduct(pId, { hsnCode: quickHsnVal.trim() });
    setIsSavingHsn(false);

    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `HSN Code for "${editingHsnProduct.title || editingHsnProduct.name}" updated to "${quickHsnVal.trim()}". All new invoices will use this code.`,
      });
      setEditingHsnProduct(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      alert(`Failed to update HSN code: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-sm font-bold text-primary">Towel Products Management</h1>
          <p className="text-body-sm text-on-surface-variant">
            Create and edit towel catalog products, upload images, configure dynamic towel sizes, adjust wholesale prices, and manage product HSN codes for tax bills.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-primary-container hover:bg-primary text-white px-4 py-2.5 rounded-lg font-label-md font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          <span>Create New Product</span>
        </Link>
      </div>

      {/* Success Notification */}
      {feedbackMessage && (
        <div className="p-3 bg-[#E6F5F0] border border-secondary-fixed text-secondary rounded-xl text-body-sm font-semibold flex items-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Error Banners */}
      {(error || deleteError) && (
        <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{deleteError || error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && products.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-body-sm text-on-surface-variant font-medium">Loading products from MongoDB...</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center space-y-4 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <div>
            <h3 className="text-title-md font-bold text-primary">No Products Found</h3>
            <p className="text-body-sm text-on-surface-variant">Create your first wholesale towel product.</p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-bold text-label-md"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Create Product</span>
          </Link>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((product) => {
            const pId = product._id || product.id;
            const s = (Array.isArray(product.sizes) && product.sizes.length > 0) ? product.sizes[0] : product;
            const sizeDimension = product.dimension || s.dimension || (s.size ? `${s.size} cm` : (product.size ? `${product.size} cm` : '50x100 cm'));
            const sizeGrams = product.grams || s.grams || Math.round((product.weightKg || s.weightKg || 0.3) * 1000) || 300;
            const sizeGsm = product.gsm || s.gsm || 600;
            const unitPrice = product.price !== undefined && product.price !== null ? Number(product.price) : Number(s.price ?? 220);
            const unitStock = product.stock !== undefined && product.stock !== null ? Number(product.stock) : Number(s.stock ?? 0);
            const isOutOfStock = unitStock <= 0;
            const productHsn = product.hsnCode || '6302.60';

            return (
              <article
                key={pId}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Product Header with Image */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-surface-container overflow-hidden border border-outline-variant shrink-0 relative shadow-inner">
                    <img
                      src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=600&q=80'}
                      alt={product.title || product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                      {sizeDimension}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-primary text-title-md leading-tight truncate">
                        {product.title || product.name}
                      </h3>
                      <span className={`text-label-sm font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        product.active !== false
                          ? 'bg-[#E6F5F0] text-secondary border-secondary-fixed'
                          : 'bg-error-container text-on-error-container border-error/30'
                      }`}>
                        {product.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                      {product.subtitle || product.description || 'Institutional Commercial Grade Terry Towel'}
                    </p>
                    
                    {/* Specifications Bar with Editable HSN Badge */}
                    <div className="flex flex-wrap items-center gap-2 text-label-sm mt-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenHsnModal(product)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded text-label-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Click to edit HSN Code for this product"
                      >
                        <span className="material-symbols-outlined text-xs">sell</span>
                        <span>HSN: <strong>{productHsn}</strong></span>
                        <span className="material-symbols-outlined text-xs text-primary/70">edit</span>
                      </button>

                      <span className="text-outline text-xs">•</span>
                      <span className="text-on-surface-variant font-medium">{product.weaveType || '2/20s Ring'}</span>
                      <span className="text-outline text-xs">•</span>
                      <span className="font-mono font-bold text-primary">₹{unitPrice}/pc</span>
                    </div>
                  </div>
                </div>

                {/* Single Size Specification & Stock Details */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-border-subtle">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-body-sm">
                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                      <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Size Dimension</span>
                      <span className="font-mono font-bold text-primary">{sizeDimension}</span>
                    </div>

                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                      <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Unit Weight</span>
                      <span className="font-mono font-bold text-secondary">{sizeGrams}g ({sizeGsm} GSM)</span>
                    </div>

                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                      <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Wholesale Price</span>
                      <span className="font-mono font-bold text-primary">₹{unitPrice} <span className="text-[10px] text-on-surface-variant font-normal">/pc</span></span>
                    </div>

                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
                      <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Warehouse Stock</span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        !isOutOfStock
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {unitStock} pcs {!isOutOfStock ? 'Available' : 'Sold Out'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                  <Link
                    to="/admin/inventory"
                    className="text-label-sm font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">straighten</span>
                    <span>Manage Sizes &amp; Stock</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(pId, product.active !== false)}
                      className={`px-3 py-2 rounded-lg text-label-sm font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                        product.active !== false
                          ? 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-error-container/40 hover:text-error hover:border-error'
                          : 'bg-[#E6F5F0] border-secondary text-secondary hover:bg-secondary hover:text-white'
                      }`}
                      title={product.active !== false ? 'Click to hide from public storefront' : 'Click to publish product live'}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {product.active !== false ? 'visibility_off' : 'visibility'}
                      </span>
                      <span>{product.active !== false ? 'Set Inactive' : 'Set Active'}</span>
                    </button>

                    <Link
                      to={`/admin/products/${pId}/edit`}
                      className="px-4 py-2 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Edit Product</span>
                    </Link>

                    {product.active === false ? (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(pId, product.title || product.name)}
                        className="px-3 py-2 bg-error text-white hover:bg-error/90 rounded-lg text-label-sm font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        title="Permanently remove inactive product from catalog"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(pId, product.title || product.name)}
                        className="p-2 text-error hover:bg-error-container/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title="Remove product"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick Edit HSN Code Modal */}
      {editingHsnProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-label-xs uppercase font-bold text-secondary tracking-wider">
                  Quick HSN Configuration
                </span>
                <h2 className="text-title-md font-bold text-primary mt-0.5">
                  {editingHsnProduct.title || editingHsnProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingHsnProduct(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-body-xs text-on-surface-variant leading-relaxed">
              Updating the HSN code for this product will immediately apply to all new wholesale orders and commercial bills generated for this item.
            </p>

            <form onSubmit={handleSaveHsn} className="space-y-4">
              <div>
                <label className="block text-label-sm font-bold text-primary mb-1">
                  Product HSN Code *
                </label>
                <input
                  type="text"
                  required
                  value={quickHsnVal}
                  onChange={(e) => setQuickHsnVal(e.target.value.trim())}
                  placeholder="e.g. 6302.60 or 5208.11"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-body-md text-primary font-mono font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingHsnProduct(null)}
                  className="px-4 py-2 border border-outline-variant rounded-xl text-label-sm font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHsn || !quickHsnVal.trim()}
                  className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-xl text-label-sm font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSavingHsn ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Update HSN Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
