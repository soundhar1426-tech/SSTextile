import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';

const QUICK_DIMENSIONS = [
  { id: 'all', label: 'All Dimensions', query: '' },
  { id: '20-40', label: '20×40 cm', query: '20×40' },
  { id: '25-50', label: '25×50 cm', query: '25×50' },
  { id: '30-60', label: '30×60 cm', query: '30×60' },
  { id: '35-70', label: '35×70 cm', query: '35×70' },
  { id: '40-80', label: '40×80 cm', query: '40×80' },
  { id: '50-100', label: '50×100 cm', query: '50×100' },
  { id: '70-140', label: '70×140 cm', query: '70×140' },
  { id: '75-150', label: '75×150 cm', query: '75×150' },
  { id: '80-160', label: '80×160 cm', query: '80×160' },
];

export const Products = () => {
  const { products, loading, error, fetchProducts, millSettings } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const normalizedQuery = (searchTerm || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();

  const activeProducts = (products || []).filter((p) => p.active !== false && p.status !== 'Inactive');

  const filteredProducts = activeProducts.filter((p) => {
    if (!normalizedQuery) return true;

    const title = (p.title || p.name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const weaveType = (p.weaveType || '').toLowerCase();
    const material = (p.material || '').toLowerCase();
    const sizes = p.sizes || [];

    const matchesMeta =
      title.includes(searchTerm.toLowerCase()) ||
      category.includes(searchTerm.toLowerCase()) ||
      weaveType.includes(searchTerm.toLowerCase()) ||
      material.includes(searchTerm.toLowerCase());

    const matchesSize = sizes.some((s) => {
      const dimNorm = (s.dimension || s.size || '').replace(/[×X*]/g, 'x').replace(/\s+/g, '').toLowerCase();
      const sId = (s.id || s._id || '').toLowerCase();
      const gsm = (s.gsm || '').toString();
      return dimNorm.includes(normalizedQuery) || sId.includes(normalizedQuery) || gsm === normalizedQuery;
    });

    return matchesMeta || matchesSize;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-bold text-secondary uppercase tracking-wider">
            {millSettings?.tagline ? millSettings.tagline.toUpperCase() : 'DIRECT WEAVING MILL • ERODE'}
          </span>
          <span className="bg-[#EFECE6] text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded border border-[#D5CFC5]">
            MOQ: 40 PCS / SIZE
          </span>
        </div>
        <h1 className="text-headline-lg-mobile sm:text-headline-lg font-bold text-primary tracking-tight">
          Commercial White Towel Catalog
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Explore pure white terry towels with configurable dynamic dimensions, weights in grams, and direct mill wholesale rates.
        </p>
      </div>

      {/* Search Bar & Quick Filters */}
      <div className="space-y-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-outline text-[20px]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by towel name, dimension (25x50, 30x60 cm), or weave..."
            className="w-full pl-10 pr-8 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-label-sm font-bold text-outline uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Quick Filters:
          </span>
          {QUICK_DIMENSIONS.map((filter) => {
            const isActive = (!filter.query && !searchTerm) || (filter.query && searchTerm.includes(filter.query));
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSearchTerm(filter.query)}
                className={`px-3 py-1 rounded-full text-label-sm font-semibold transition-all shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-white border-primary-container shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/40 hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (!products || products.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 border-3 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-on-surface-variant font-medium">Loading catalog from mill database...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (!products || products.length === 0) && (
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline">cloud_off</span>
          <h3 className="text-title-md font-bold text-primary">Unable to load products. Please try again.</h3>
          <p className="text-body-sm text-on-surface-variant">
            We could not connect to the backend server. Please verify your connection and retry.
          </p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-primary-container text-white rounded-lg text-label-md font-bold hover:bg-primary shadow-sm inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Product List */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
          <h3 className="text-title-md font-bold text-primary">No Towel SKUs Found</h3>
          <p className="text-body-sm text-on-surface-variant">Try adjusting your search query.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-label-md font-bold hover:bg-primary-container"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id || product._id}
              product={product}
              selectedDimension={searchTerm}
              onSelectDimension={(dim) => setSearchTerm(dim)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

