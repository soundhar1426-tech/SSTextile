import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';

export const Inventory = () => {
  const { products, loading, error, adjustSizeStock, addSize, deleteSize, updateSize, fetchProducts, fetchInventorySummary } = useProducts();

  useEffect(() => {
    fetchProducts();
    fetchInventorySummary();
  }, [fetchProducts, fetchInventorySummary]);

  // Find primary or selected product
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' or 'TABLE'
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New size form state (free-form dynamic size with explicit grams)
  const [newSizeForm, setNewSizeForm] = useState({
    widthCm: 50,
    lengthCm: 90,
    price: 180,
    stock: 120,
    gsm: 550,
    grams: 248,
  });

  const activeProduct = products.find((p) => (p._id || p.id) === selectedProductId) || products[0] || null;
  const currentProductId = activeProduct ? (activeProduct._id || activeProduct.id) : null;

  // Flatten all active sizes across products for inventory management
  const allSizes = products.flatMap((p) =>
    (p.sizes || []).map((s) => ({
      ...s,
      productName: p.name || p.title,
      productId: p._id || p.id,
    }))
  );

  const totalInventory = allSizes.reduce((sum, s) => sum + Number(s.stock || 0), 0);
  const activeSizesCount = allSizes.length;

  const handleDimensionOrGsmChange = (field, val) => {
    const updated = { ...newSizeForm, [field]: val };
    const w = Number(field === 'widthCm' ? val : updated.widthCm) || 0;
    const l = Number(field === 'lengthCm' ? val : updated.lengthCm) || 0;
    const g = Number(field === 'gsm' ? val : updated.gsm) || 500;
    // Auto-calculate standard grams if valid dimensions
    if (w > 0 && l > 0 && g > 0) {
      updated.grams = Math.max(10, Math.round((w * l * g) / 10000));
    }
    setNewSizeForm(updated);
  };

  const handleCreateSize = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!currentProductId) {
      setFormError('Please select or create a product first.');
      return;
    }

    const width = Number(newSizeForm.widthCm);
    const length = Number(newSizeForm.lengthCm);
    const sizeStr = `${width}x${length}`;
    const price = Number(newSizeForm.price);
    const stock = Number(newSizeForm.stock);
    const grams = Number(newSizeForm.grams) || Math.max(10, Math.round((width * length * (Number(newSizeForm.gsm) || 500)) / 10000));

    if (price < 0 || stock < 0) {
      setFormError('Price and Stock must be 0 or greater.');
      return;
    }

    if (grams <= 0) {
      setFormError('Weight in grams must be greater than 0.');
      return;
    }

    // STRICT DUPLICATE CHECK: Prevent duplicate size dimensions
    const isDuplicate = (activeProduct?.sizes || []).some((s) => {
      const existingKey = String(s.size || s.dimension || '')
        .toLowerCase()
        .replace(/cm|inch|in/gi, '')
        .replace(/[×*X]/g, 'x')
        .replace(/\s+/g, '')
        .trim();
      return existingKey === sizeStr;
    });

    if (isDuplicate) {
      setFormError(`⚠️ Size "${sizeStr}" (${width}x${length} cm) already exists for this product. Duplicate sizes cannot be added.`);
      return;
    }

    setIsSubmitting(true);
    const result = await addSize(currentProductId, {
      size: sizeStr,
      price,
      stock,
      gsm: Number(newSizeForm.gsm) || 500,
      grams: grams,
      weightKg: Number((grams / 1000).toFixed(3)),
    });
    setIsSubmitting(false);

    if (result.success) {
      setShowAddModal(false);
      setNewSizeForm({
        widthCm: 60,
        lengthCm: 100,
        price: 220,
        stock: 150,
        gsm: 600,
        grams: 360,
      });
    } else {
      setFormError(result.error || 'Failed to add size to MongoDB.');
    }
  };

  const handleQuickPriceEdit = async (productId, sizeId, currentPrice) => {
    const newPrice = prompt('Enter updated wholesale rate (₹/pc):', currentPrice);
    if (newPrice !== null && !isNaN(newPrice)) {
      const num = Number(newPrice);
      if (num < 0) {
        alert('Price cannot be negative.');
        return;
      }
      await updateSize(productId, sizeId, { price: num });
    }
  };

  const handleQuickGramsEdit = async (productId, sizeId, currentGrams) => {
    const newGrams = prompt('Enter updated towel weight in grams (grms):', currentGrams || 100);
    if (newGrams !== null && !isNaN(newGrams)) {
      const num = Number(newGrams);
      if (num <= 0) {
        alert('Grams must be greater than 0.');
        return;
      }
      await updateSize(productId, sizeId, {
        grams: num,
        weightKg: Number((num / 1000).toFixed(3)),
      });
    }
  };

  const handleDeleteSize = async (productId, sizeId, sizeName) => {
    if (confirm(`Are you sure you want to deactivate size "${sizeName}"?`)) {
      await deleteSize(productId, sizeId);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* WAREHOUSE SUMMARY TICKER (REAL MONGODB METRICS) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-base">factory</span>
            <span className="text-label-md font-label-md text-on-surface uppercase tracking-wider font-bold">
              Tiruppur Towel Manufacturer Inventory
            </span>
          </div>
          <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-mono font-bold">
            WH-B1
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
            <span className="block text-label-sm font-label-sm text-on-surface-variant font-bold uppercase">
              Total Pieces in Stock
            </span>
            <span className="text-title-md md:text-headline-sm font-bold text-primary font-mono">
              {totalInventory}{' '}
              <span className="text-label-sm font-normal text-on-surface-variant">pcs</span>
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
            <span className="block text-label-sm font-label-sm text-on-surface-variant font-bold uppercase">
              Active SKUs / Sizes
            </span>
            <span className="text-title-md md:text-headline-sm font-bold text-primary font-mono">
              {activeSizesCount}{' '}
              <span className="text-label-sm font-normal text-on-surface-variant">Sizes</span>
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
            <span className="block text-label-sm font-label-sm text-on-surface-variant font-bold uppercase">
              Total Products
            </span>
            <span className="text-title-md md:text-headline-sm font-bold text-secondary font-mono">
              {products.length}{' '}
              <span className="text-label-sm font-normal text-on-surface-variant">Catalog</span>
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: DYNAMIC SIZE MANAGER */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-title-md font-title-md text-primary font-bold">
              Dynamic Size Manager
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Define Terry Towel dimensions (e.g. 25x50, 30x60, 40x80, 50x90, 60x100) with independent price &amp; stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Product Selector Dropdown if multiple products exist */}
            {products.length > 1 && (
              <select
                value={selectedProductId || (activeProduct?._id || activeProduct?.id || '')}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1 text-label-sm font-bold text-primary outline-none"
              >
                {products.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name || p.title}
                  </option>
                ))}
              </select>
            )}

            <div className="flex rounded-lg border border-outline-variant overflow-hidden bg-surface-container-low">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 text-label-sm font-bold flex items-center gap-1 ${viewMode === 'CARDS' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">view_agenda</span>
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 text-label-sm font-bold flex items-center gap-1 ${viewMode === 'TABLE' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">table_rows</span>
                Table
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(!showAddModal)}
              className="inline-flex items-center gap-1 bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-label-md font-bold hover:bg-primary transition-colors shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{showAddModal ? 'Close Panel' : 'New Dynamic Size'}</span>
            </button>
          </div>
        </div>

        {/* CREATE NEW SIZE FORM PANEL */}
        {showAddModal && (
          <form onSubmit={handleCreateSize} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-label-md font-label-md text-primary uppercase tracking-wide flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-base">straighten</span>
                Add Dynamic Size to: {activeProduct?.name || activeProduct?.title || 'White Towel'}
              </span>
              <span className="text-label-sm font-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-bold">
                MongoDB Dynamic
              </span>
            </div>

            {formError && (
              <div className="p-2.5 bg-error-container text-on-error-container rounded-lg text-body-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Dimension, Grams, Price & Stock Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Width (cm) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={10}
                    max={300}
                    value={newSizeForm.widthCm}
                    onChange={(e) => handleDimensionOrGsmChange('widthCm', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono text-primary outline-none focus:border-primary"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-2 text-label-sm text-outline font-bold">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Length (cm) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={10}
                    max={400}
                    value={newSizeForm.lengthCm}
                    onChange={(e) => handleDimensionOrGsmChange('lengthCm', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono text-primary outline-none focus:border-primary"
                    placeholder="90"
                  />
                  <span className="absolute right-3 top-2 text-label-sm text-outline font-bold">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Weight (Grams / grms) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={newSizeForm.grams}
                    onChange={(e) => setNewSizeForm({ ...newSizeForm, grams: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono text-primary font-bold outline-none focus:border-primary"
                    placeholder="248"
                  />
                  <span className="absolute right-3 top-2 text-label-sm text-outline font-bold">g</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Wholesale Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newSizeForm.price}
                  onChange={(e) => setNewSizeForm({ ...newSizeForm, price: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono text-primary font-bold outline-none focus:border-primary"
                  placeholder="180"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                  Initial Stock (pcs) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newSizeForm.stock}
                  onChange={(e) => setNewSizeForm({ ...newSizeForm, stock: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono text-primary font-bold outline-none focus:border-primary"
                  placeholder="120"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg text-label-lg font-bold hover:bg-primary-container transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Size...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save Dynamic Size ({newSizeForm.widthCm}x{newSizeForm.lengthCm} • {newSizeForm.grams}g)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* SECTION 2: LIVE INVENTORY & PRICING CONTROL TABLE / CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-title-md font-title-md text-primary font-bold">
              Live Sizes &amp; Stock Inventory
            </span>
            <span className="text-label-sm font-label-sm bg-surface-container-highest px-2 py-0.5 rounded text-on-surface font-semibold">
              {allSizes.length} Active Sizes
            </span>
          </div>
          <span className="text-label-sm font-label-sm text-secondary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">sync</span>
            Connected to MongoDB
          </span>
        </div>

        {loading && allSizes.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-body-sm text-on-surface-variant">Loading inventory from MongoDB...</p>
          </div>
        ) : allSizes.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant text-body-sm text-on-surface-variant">
            No sizes currently in inventory. Click "New Dynamic Size" above to create one.
          </div>
        ) : viewMode === 'TABLE' ? (
          /* View Mode 1: Table View */
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-label-sm font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="p-3">Product &amp; Size</th>
                  <th className="p-3">Towel Weight (Grams)</th>
                  <th className="p-3">Wholesale Price (₹)</th>
                  <th className="p-3">Warehouse Stock</th>
                  <th className="p-3">Stock Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {allSizes.map((size) => {
                  const sId = size._id || size.id;
                  const gramsVal = size.grams || Math.round((size.weightKg || 0.1) * 1000);
                  return (
                    <tr key={sId} className="hover:bg-surface-container-low/50">
                      <td className="p-3 font-bold text-primary">
                        <span className="block text-primary font-sans">{size.productName}</span>
                        <span className="text-secondary font-mono font-bold text-body-sm">{size.size || size.dimension}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{gramsVal}g</span>
                        <span className="text-on-surface-variant text-xs font-sans block">{size.gsm || 500} GSM</span>
                      </td>
                      <td className="p-3 font-bold text-primary">
                        ₹{size.price}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{size.stock}</span> pcs
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${size.stock > 0
                            ? 'bg-[#E6F5F0] text-secondary border border-secondary-fixed'
                            : 'bg-error-container text-on-error-container'
                          }`}>
                          {size.stock > 0 ? (size.stock <= 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickGramsEdit(size.productId, sId, gramsVal)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-secondary transition-colors"
                            title="Edit Grams"
                          >
                            Edit Grams
                          </button>
                          <button
                            onClick={() => handleQuickPriceEdit(size.productId, sId, size.price)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-primary transition-colors"
                          >
                            Edit Price
                          </button>
                          <button
                            onClick={() => handleDeleteSize(size.productId, sId, size.size || size.dimension)}
                            className="p-1 text-error hover:bg-error-container rounded transition-colors"
                            title="Deactivate Size"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Stitch Cards View with Real Restock Steppers */
          <div className="space-y-3">
            {allSizes.map((size) => {
              const sId = size._id || size.id;
              const gramsVal = size.grams || Math.round((size.weightKg || 0.1) * 1000);
              return (
                <div
                  key={sId}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 relative shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-title-md font-title-md text-primary font-bold tracking-tight">
                          {size.size || size.dimension}
                        </h3>
                        <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-medium">
                          {size.productName}
                        </span>
                        <span className="text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold font-mono">
                          {gramsVal}g ({size.gsm || 500} GSM)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Wholesale Rate:</span>
                          <div className="inline-flex items-center bg-surface-container-low border border-outline-variant rounded px-2 py-0.5">
                            <span className="text-label-md font-label-md font-bold text-primary font-mono">₹{size.price}</span>
                            <button
                              onClick={() => handleQuickPriceEdit(size.productId, sId, size.price)}
                              className="ml-1 text-on-surface-variant hover:text-primary active:scale-95"
                              title="Quick Edit Price"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">Weight (grms):</span>
                          <div className="inline-flex items-center bg-surface-container-low border border-outline-variant rounded px-2 py-0.5">
                            <span className="text-label-md font-label-md font-bold text-secondary font-mono">{gramsVal}g</span>
                            <button
                              onClick={() => handleQuickGramsEdit(size.productId, sId, gramsVal)}
                              className="ml-1 text-on-surface-variant hover:text-secondary active:scale-95"
                              title="Quick Edit Grams"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickGramsEdit(size.productId, sId, gramsVal)}
                        className="p-1 rounded text-on-surface-variant hover:bg-surface-container"
                        title="Edit Weight (Grams)"
                      >
                        <span className="material-symbols-outlined text-lg">scale</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPriceEdit(size.productId, sId, size.price)}
                        className="p-1 rounded text-on-surface-variant hover:bg-surface-container"
                        title="Edit Price"
                      >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSize(size.productId, sId, size.size || size.dimension)}
                        className="p-1 rounded text-error hover:bg-error-container"
                        title="Delete Size"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Stock Level & Stepper Inline Action */}
                  <div className="pt-2.5 border-t border-surface-container flex flex-wrap items-center justify-between bg-surface-container-low -mx-3.5 -mb-3.5 p-3 rounded-b-xl gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-label-sm font-label-sm text-on-surface-variant">Available Stock</span>
                        <span className="text-title-md font-title-md text-primary font-bold font-mono">
                          {size.stock} <span className="text-label-sm font-normal text-on-surface-variant">pcs</span>
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded font-bold ml-1 ${size.stock > 0
                          ? size.stock >= 200
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-surface-container-high text-on-surface'
                          : 'bg-error-container text-on-error-container'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${size.stock > 0 ? 'bg-secondary' : 'bg-error'}`}></span>
                        {size.stock > 0 ? (size.stock <= 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Restock Quick Stepper Controls */}
                    <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => adjustSizeStock(size.productId, sId, -20)}
                        className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container rounded active:scale-95 font-bold"
                        title="Reduce 20 pieces"
                      >
                        −
                      </button>
                      <span className="px-2 text-label-md font-label-md text-primary font-bold font-mono">
                        ±20
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustSizeStock(size.productId, sId, 20)}
                        className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container rounded active:scale-95 font-bold"
                        title="Add 20 pieces"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustSizeStock(size.productId, sId, 50)}
                        className="ml-1 bg-primary text-on-primary px-2.5 py-1 rounded text-label-sm font-label-sm hover:bg-primary-container active:scale-95 flex items-center gap-0.5 font-bold transition-colors"
                        title="Add 50 pieces bulk restock"
                      >
                        <span className="material-symbols-outlined text-xs">add_box</span>
                        +50 Restock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Inventory;
