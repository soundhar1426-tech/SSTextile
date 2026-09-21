import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

const sampleImages = [
  {
    label: "Front View - Crisp White Towel",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw"
  },
  {
    label: "Back View / Stacked",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4G6yJKWXrsFcKnRVjY4iUeQqaDk4bnROUb1QZsoFAMBBxbVCMHmiGkwcXOhvfDMxeuAHEPpxaM-hZxHrTfmx3zka_ed-0v15OyyV0sSW4oWhC9VzT8M8cxOkv9BX9Hd-f9-Gi5XmB1SqNGEIhriYPqsbo_hEcLU8WZEo_fcNleWS1-uA6bKz7nLhIayTVKmcOwq6fJZn2kaA_GRkWOXz0dUrsNFQH3IO9lAE2TAC3he6E378VTZmQaA"
  },
  {
    label: "Fabric Texture / Loom Border",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoDYdD9ozOqIkie8Ri4dtlGbS54d2Pyh1nFBU5yIIRZB5DJvm3ql4Y858m1_4WsL3K0A4cLOxTIG6fNWzBJZ_QI6WZkhnWDmTQsm1mY-TBGsDrhDUyssfPYFRf25byd1ojjtYFtp8i7AZ0cUCebRzVLdwV1XZ3T635MNtPTiHY_uu9TRt55-_B8qF--iLFVdULjBex9lnRvmRFiF5TZ6y3wUz8oWevpWo64cOO__kNWnCe5NrnuFBMrw"
  }
];

const SLOT_LABELS = [
  { title: "Front Side (Cover Photo)", desc: "Main image shown on catalog & storefront", badge: "Front" },
  { title: "Back Side (Reverse Angle)", desc: "Reverse view or folded pile presentation", badge: "Back" },
  { title: "Fabric Texture / Border Detail", desc: "Close-up of weave, loops, border hem", badge: "Detail" },
  { title: "Packaging / Bundle Angle", desc: "Bundle, carton packing or alternate view", badge: "Angle 4" },
];

export const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createProduct, updateProduct, deleteProduct, getProductById, fetchProducts, fetchInventorySummary, products } = useProducts();

  const multiFileInputRef = useRef(null);
  const singleSlotFileInputRef = useRef(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState(0);
  const hasLoadedIdRef = useRef(null);

  const isEdit = Boolean(id);

  // Synchronously find initial product from memory/localStorage
  const getInitialProduct = () => {
    if (!id) return null;
    const cleanId = String(id).trim();
    const list = Array.isArray(products) && products.length > 0 ? products : [];
    let found = list.find(
      (p) =>
        String(p.id) === cleanId ||
        String(p._id) === cleanId ||
        (p.name && p.name.toLowerCase() === cleanId.toLowerCase()) ||
        (p.title && p.title.toLowerCase() === cleanId.toLowerCase())
    );
    if (!found) {
      try {
        const saved = localStorage.getItem('gtex_catalog_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            found = parsed.find(
              (p) =>
                String(p.id) === cleanId ||
                String(p._id) === cleanId ||
                (p.name && p.name.toLowerCase() === cleanId.toLowerCase()) ||
                (p.title && p.title.toLowerCase() === cleanId.toLowerCase())
            ) || parsed[0];
          }
        }
      } catch (e) {}
    }
    return found || (list.length > 0 ? list[0] : null);
  };

  const initialProduct = getInitialProduct();

  const [formData, setFormData] = useState(() => {
    if (initialProduct) {
      return {
        title: initialProduct.name || initialProduct.title || 'White Towels',
        subtitle: initialProduct.description || initialProduct.subtitle || 'Direct Weaving Mill 100% Cotton Plain White Terry Towels',
        category: initialProduct.category || 'White Towels',
        hsnCode: initialProduct.hsnCode || '6302.60',
        gsmRange: initialProduct.gsmRange || '500 - 650 GSM',
        weaveType: initialProduct.weaveType || '2/20s Ring Spun',
        material: initialProduct.material || '100% Cotton',
        active: initialProduct.active !== false,
      };
    }
    return {
      title: '',
      subtitle: '',
      category: 'White Towels',
      hsnCode: '6302.60',
      gsmRange: '500 - 650 GSM',
      weaveType: '2/20s Ring Spun',
      material: '100% Cotton',
      active: true,
    };
  });

  const [images, setImages] = useState(() => {
    if (initialProduct) {
      const pImages = Array.isArray(initialProduct.images) && initialProduct.images.length > 0
        ? initialProduct.images.filter(Boolean)
        : initialProduct.image
        ? [initialProduct.image]
        : [sampleImages[0].url];
      return pImages.length > 0 ? pImages : [sampleImages[0].url];
    }
    return [sampleImages[0].url, sampleImages[1].url];
  });

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [imageSourceMode, setImageSourceMode] = useState('UPLOAD'); // 'UPLOAD' | 'PRESETS' | 'URL'
  const [urlInputVal, setUrlInputVal] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Single product size configuration state
  const [sizeData, setSizeData] = useState(() => {
    if (initialProduct) {
      const s = (Array.isArray(initialProduct.sizes) && initialProduct.sizes.length > 0)
        ? initialProduct.sizes[0]
        : initialProduct;
      const dimStr = s.dimension || (s.size ? `${s.size} cm` : '50x100 cm');
      const sizeKey = s.size || dimStr.replace(/cm|inch|in/gi, '').replace(/[×*X]/g, 'x').replace(/\s+/g, '').trim() || '50x100';
      const g = Number(s.grams) || Math.round(Number(s.weightKg || 0.1) * 1000) || 300;
      return {
        size: sizeKey,
        dimension: dimStr,
        price: Number(s.price ?? initialProduct.price ?? 220),
        stock: Number(s.stock ?? initialProduct.stock ?? 350),
        gsm: Number(s.gsm || initialProduct.gsm || 600),
        grams: g,
        weightKg: Number(s.weightKg) || Number((g / 1000).toFixed(3)),
      };
    }
    return {
      size: '50x100',
      dimension: '50x100 cm',
      price: 220,
      stock: 350,
      gsm: 600,
      grams: 300,
      weightKg: 0.300,
    };
  });

  // Revalidate with latest backend data if editing
  useEffect(() => {
    if (!isEdit || !id) return;
    if (hasLoadedIdRef.current === id) return;
    hasLoadedIdRef.current = id;

    let isMounted = true;

    const fetchProductDetail = async () => {
      try {
        const res = await getProductById(id);
        if (isMounted && res && (res.success || res.product)) {
          const p = res.product || res;
          setFormData({
            title: p.name || p.title || 'White Towels',
            subtitle: p.description || p.subtitle || 'Direct Weaving Mill Cotton Plain White Terry Towels',
            category: p.category || 'White Towels',
            hsnCode: p.hsnCode || '6302.60',
            gsmRange: p.gsmRange || '500 - 650 GSM',
            weaveType: p.weaveType || '2/20s Ring Spun',
            material: p.material || '100% Cotton',
            active: p.active !== false,
          });

          const productImages =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images.filter(Boolean)
              : p.image
              ? [p.image]
              : [sampleImages[0].url];

          setImages(productImages.length > 0 ? productImages : [sampleImages[0].url]);

          const s = (Array.isArray(p.sizes) && p.sizes.length > 0) ? p.sizes[0] : p;
          if (s) {
            const dimStr = s.dimension || (s.size ? `${s.size} cm` : '50x100 cm');
            const sizeKey = s.size || dimStr.replace(/cm|inch|in/gi, '').replace(/[×*X]/g, 'x').replace(/\s+/g, '').trim() || '50x100';
            const g = Number(s.grams) || Math.round(Number(s.weightKg || 0.1) * 1000) || 300;
            setSizeData({
              size: sizeKey,
              dimension: dimStr,
              price: Number(s.price ?? p.price ?? 220),
              stock: Number(s.stock ?? p.stock ?? 350),
              gsm: Number(s.gsm || p.gsm || 600),
              grams: g,
              weightKg: Number(s.weightKg) || Number((g / 1000).toFixed(3)),
            });
          }
        }
      } catch (err) {
        console.warn('[ProductForm] Notice loading product detail:', err);
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit, getProductById]);

  // Client-side canvas optimization for image file
  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        return resolve(null);
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawBase64 = uploadEvent.target?.result;
        if (!rawBase64) return resolve(null);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
          resolve(optimizedBase64);
        };
        img.onerror = () => resolve(rawBase64);
        img.src = rawBase64;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Handle multiple files upload
  const handleBatchFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 4);
    const optimized = await Promise.all(files.map((f) => optimizeImage(f)));
    const valid = optimized.filter(Boolean);

    if (valid.length > 0) {
      setImages(valid);
      setActivePreviewIndex(0);
    }
  };

  // Handle single file upload for a specific slot
  const handleSingleSlotUpload = async (e, slotIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await optimizeImage(file);
    if (base64) {
      setImages((prev) => {
        const copy = [...prev];
        copy[slotIndex] = base64;
        return copy;
      });
      setActivePreviewIndex(slotIndex);
    }
    if (e.target) e.target.value = '';
  };

  const triggerSlotUpload = (slotIndex) => {
    setActiveUploadSlot(slotIndex);
    singleSlotFileInputRef.current?.click();
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleBatchFiles(files);
    }
  };

  const handleMakeCover = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
    setActivePreviewIndex(0);
  };

  const handleRemoveImage = (index) => {
    if (images.length <= 1) {
      alert('A product requires at least 1 image (Front cover).');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    setActivePreviewIndex(0);
  };

  const handleAddSlot = () => {
    if (images.length >= 4) {
      alert('Maximum 4 images allowed per product (Front, Back, Detail, Extra).');
      return;
    }
    const nextPreset = sampleImages[images.length] ? sampleImages[images.length].url : sampleImages[0].url;
    setImages([...images, nextPreset]);
    setActivePreviewIndex(images.length);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessBanner('');

    if (!formData.title.trim()) {
      setErrorMessage('Product title/name is required.');
      return;
    }

    const validImages = images.filter(Boolean);
    if (validImages.length === 0) {
      setErrorMessage('Please upload at least 1 product image (Front Side).');
      return;
    }

    if (!sizeData.dimension || !sizeData.dimension.trim()) {
      setErrorMessage('Please specify the towel size / dimension.');
      return;
    }

    const priceNum = Number(sizeData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please enter a valid wholesale price per piece.');
      return;
    }

    const stockNum = Number(sizeData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMessage('Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);

    const cleanDim = sizeData.dimension.trim();
    const cleanSizeKey = sizeData.size ? sizeData.size.trim() : cleanDim.replace(/cm|inch|in/gi, '').replace(/[×*X]/g, 'x').replace(/\s+/g, '').trim() || cleanDim;
    const gramsNum = Number(sizeData.grams) || Math.round(Number(sizeData.weightKg || 0.1) * 1000) || 300;
    const weightKgNum = Number((gramsNum / 1000).toFixed(3));
    const gsmNum = Number(sizeData.gsm) || 600;

    const singleSizeObj = {
      _id: `sz-${Date.now()}`,
      id: `sz-${Date.now()}`,
      size: cleanSizeKey,
      dimension: cleanDim.toLowerCase().includes('cm') ? cleanDim : `${cleanDim} cm`,
      price: priceNum,
      stock: stockNum,
      gsm: gsmNum,
      grams: gramsNum,
      weightKg: weightKgNum,
      active: true,
    };

    const payload = {
      name: formData.title.trim(),
      title: formData.title.trim(),
      description: formData.subtitle.trim(),
      subtitle: formData.subtitle.trim(),
      category: formData.category,
      hsnCode: formData.hsnCode,
      weaveType: formData.weaveType,
      material: formData.material,
      images: validImages,
      image: validImages[0],
      active: formData.active,
      size: cleanSizeKey,
      dimension: singleSizeObj.dimension,
      price: priceNum,
      stock: stockNum,
      gsm: gsmNum,
      grams: gramsNum,
      weightKg: weightKgNum,
      sizes: [singleSizeObj],
    };

    let result;
    if (isEdit) {
      result = await updateProduct(id, payload);
    } else {
      result = await createProduct(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      try {
        await fetchProducts();
        await fetchInventorySummary();
      } catch (e) {}
      setSuccessBanner('✓ Product saved and catalog updated successfully!');
      setTimeout(() => {
        navigate('/admin/products');
      }, 500);
    } else {
      setErrorMessage(result.error || 'Failed to save product.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to deactivate "${formData.title || 'this product'}"?`)) {
      setIsSubmitting(true);
      const result = await deleteProduct(id);
      setIsSubmitting(false);
      if (result.success) {
        navigate('/admin/products');
      } else {
        setErrorMessage(result.error || 'Failed to delete product');
      }
    }
  };

  const currentPreviewImage = images[activePreviewIndex] || images[0] || sampleImages[0].url;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Hidden file inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
        multiple
        onChange={(e) => handleBatchFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={singleSlotFileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
        onChange={(e) => handleSingleSlotUpload(e, activeUploadSlot)}
        className="hidden"
      />

      {/* Top Header with Breadcrumbs & Save CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors shadow-2xs"
            title="Return to Product List"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-headline-sm font-bold text-primary">
              {isEdit ? `Edit Product: ${formData.title || 'Towel'}` : 'Create New Towel Product'}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Manage product images, specifications, dynamic sizes, and pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="px-3 py-2 border border-outline-variant bg-surface-container text-primary rounded-lg font-label-md font-bold hover:bg-surface-container-high transition-all text-xs"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-container hover:bg-primary text-white rounded-lg font-label-md font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>{isSubmitting ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3 bg-[#E6F5F0] border border-secondary-fixed text-secondary rounded-xl text-body-sm font-semibold flex items-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{successBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm font-semibold flex items-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. PRODUCT PHOTOGRAPHY */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-title-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-lg">photo_library</span>
                1. Product Photography (Multi-Angle Views)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Upload Front side, Back side, and Detail views.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Upload Photos</span>
              </button>
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="px-3 py-1.5 border border-outline-variant bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Angle Slot</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Image Preview */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Active Preview: {SLOT_LABELS[activePreviewIndex]?.badge || `Photo ${activePreviewIndex + 1}`}
                </span>
                <span className="text-xs font-mono text-outline">
                  {activePreviewIndex + 1} of {images.length}
                </span>
              </div>

              <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant shadow-inner group">
                <img
                  src={currentPreviewImage}
                  alt="Towel Active View"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  onError={(e) => {
                    e.target.src = sampleImages[0].url;
                  }}
                />

                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-secondary-fixed">verified</span>
                  <span>{SLOT_LABELS[activePreviewIndex]?.title || `Angle ${activePreviewIndex + 1}`}</span>
                </div>

                {activePreviewIndex === 0 && (
                  <div className="absolute top-3 right-3 bg-secondary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
                    MAIN STORE COVER
                  </div>
                )}
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => multiFileInputRef.current?.click()}
                className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-secondary bg-secondary-fixed/20 text-secondary font-bold'
                    : 'border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <p className="text-xs font-semibold">
                  Drag &amp; drop image files here or <span className="text-secondary font-bold underline">click to browse</span>
                </p>
              </div>
            </div>

            {/* Right: Angle Slots List */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-bold text-primary">
                  Configured Angles ({images.length} / 4)
                </span>
                <span className="text-[11px] text-outline">Click slot to select</span>
              </div>

              <div className="space-y-2.5">
                {images.map((imgUrl, idx) => {
                  const labelInfo = SLOT_LABELS[idx] || {
                    title: `Additional Angle ${idx + 1}`,
                    desc: 'Extra view for towel specification',
                    badge: `Angle ${idx + 1}`,
                  };
                  const isSelected = activePreviewIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                          : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-surface-container border border-outline-variant shrink-0 relative">
                        <img
                          src={imgUrl}
                          alt={labelInfo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = sampleImages[0].url;
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold py-0.2 text-center uppercase tracking-wider truncate">
                          {labelInfo.badge}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                            {labelInfo.title}
                          </span>
                          {idx === 0 && (
                            <span className="bg-[#E6F5F0] text-secondary text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Cover
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{labelInfo.desc}</p>

                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSlotUpload(idx);
                            }}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[13px]">file_upload</span>
                            Upload
                          </button>

                          {idx > 0 && (
                            <>
                              <span className="text-outline text-[10px]">•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMakeCover(idx);
                                }}
                                className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-[13px]">star</span>
                                Set as Cover
                              </button>
                            </>
                          )}

                          {images.length > 1 && (
                            <>
                              <span className="text-outline text-[10px]">•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="text-[11px] font-bold text-error hover:underline flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-[13px]">delete</span>
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Source Switcher */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex rounded-lg border border-outline-variant p-0.5 bg-surface-container-low text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('UPLOAD')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'UPLOAD'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">upload_file</span>
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('PRESETS')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'PRESETS'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">collections</span>
                    <span>Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('URL')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'URL'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">link</span>
                    <span>URL</span>
                  </button>
                </div>

                {imageSourceMode === 'PRESETS' && (
                  <div className="mt-2.5 p-2 bg-surface-container-low rounded-xl border border-outline-variant space-y-1.5">
                    <span className="text-[11px] font-bold text-on-surface-variant block">
                      Apply Preset to: <strong>{SLOT_LABELS[activePreviewIndex]?.badge || `Slot ${activePreviewIndex + 1}`}</strong>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {sampleImages.map((img, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setImages((prev) => {
                              const copy = [...prev];
                              copy[activePreviewIndex] = img.url;
                              return copy;
                            });
                          }}
                          className="h-14 rounded-lg overflow-hidden border border-outline-variant hover:border-primary transition-all relative group/preset"
                          title={img.label}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-bold py-0.2 text-center truncate">
                            {img.label.split('-')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {imageSourceMode === 'URL' && (
                  <div className="mt-2.5 p-2 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={urlInputVal}
                        onChange={(e) => setUrlInputVal(e.target.value)}
                        placeholder="https://images.unsplash.com/.../towel.jpg"
                        className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-primary font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (urlInputVal.trim()) {
                            setImages((prev) => {
                              const copy = [...prev];
                              copy[activePreviewIndex] = urlInputVal.trim();
                              return copy;
                            });
                            setUrlInputVal('');
                          }
                        }}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-container"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. TOWEL PRODUCT SPECIFICATIONS */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <h2 className="text-title-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">edit_note</span>
              2. Towel Product Specifications
            </h2>
            <span className="text-label-sm text-on-surface-variant font-medium">Catalog Specs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Product Name / Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. White Towels"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-md text-primary font-semibold focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Description / Application *
              </label>
              <input
                type="text"
                required
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. 100% Combed Ringspun Cotton Terry Towel"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Raw Material Composition
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="100% Cotton"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Weave / Yarn Count
              </label>
              <input
                type="text"
                value={formData.weaveType}
                onChange={(e) => setFormData({ ...formData, weaveType: e.target.value })}
                placeholder="2/20s Ring Spun"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                Category / Department
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary outline-none font-medium"
              >
                <option value="White Towels">White Towels</option>
                <option value="Commercial Terry Towel">Commercial Terry Towel</option>
                <option value="Hotel & Spa Series">Hotel &amp; Spa Series</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="6302.60"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-primary font-mono outline-none"
              />
            </div>
          </div>

          {/* Publishing Status */}
          <div className="pt-2 border-t border-surface-container">
            <label className="block text-label-sm font-bold text-primary mb-2">
              Catalog Publishing Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, active: true })}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  formData.active
                    ? 'bg-[#E6F5F0] border-secondary text-secondary shadow-xs font-bold'
                    : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {formData.active ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div>
                  <p className="text-body-sm font-bold leading-tight">Active (Live)</p>
                  <p className="text-[11px] font-normal text-on-surface-variant">Visible in public buyer catalog</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, active: false })}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  !formData.active
                    ? 'bg-error-container/40 border-error text-error shadow-xs font-bold'
                    : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {!formData.active ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div>
                  <p className="text-body-sm font-bold leading-tight">Inactive (Hidden)</p>
                  <p className="text-[11px] font-normal text-on-surface-variant">Draft / hidden from storefront</p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 3. SINGLE SIZE SPECIFICATION, PRICING & STOCK */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container">
            <div>
              <h2 className="text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">straighten</span>
                3. Size Specification, Pricing &amp; Stock
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Each product card holds strictly one unique size specification, direct mill weight, wholesale price, and warehouse inventory.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary-container/30 text-secondary text-xs font-bold font-mono rounded-full border border-secondary/20">
              <span className="material-symbols-outlined text-xs">verified</span> Single Size Consignment
            </span>
          </div>

          {/* Quick preset dimension buttons */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">
              Quick Select Dimension or Custom Size
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: '50x100 cm (Hand / Gym)', dim: '50x100 cm', size: '50x100', g: 300, gsm: 600, price: 220 },
                { label: '75x150 cm (Bath / Pool)', dim: '75x150 cm', size: '75x150', g: 600, gsm: 550, price: 450 },
                { label: '70x140 cm (Standard Bath)', dim: '70x140 cm', size: '70x140', g: 500, gsm: 500, price: 380 },
                { label: '35x50 cm (Face Towel)', dim: '35x50 cm', size: '35x50', g: 100, gsm: 550, price: 95 },
                { label: '40x60 cm (Kitchen / Salon)', dim: '40x60 cm', size: '40x60', g: 150, gsm: 600, price: 130 },
              ].map((preset) => {
                const isSelected = sizeData.dimension === preset.dim || sizeData.size === preset.size;
                return (
                  <button
                    key={preset.dim}
                    type="button"
                    onClick={() => {
                      setSizeData((prev) => ({
                        ...prev,
                        dimension: preset.dim,
                        size: preset.size,
                        grams: prev.grams || preset.g,
                        weightKg: Number(((prev.grams || preset.g) / 1000).toFixed(3)),
                        gsm: prev.gsm || preset.gsm,
                        price: prev.price || preset.price,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Size Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Dimension */}
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Size / Dimension *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={sizeData.dimension}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleanKey = val.replace(/cm|inch|in/gi, '').replace(/[×*X]/g, 'x').replace(/\s+/g, '').trim() || val;
                    setSizeData({ ...sizeData, dimension: val, size: cleanKey });
                  }}
                  placeholder="e.g. 50x100 cm"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-body-md font-bold text-primary focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-on-surface-variant/60 pointer-events-none">
                  cm
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Width × Length (e.g. 50x100 cm)</p>
            </div>

            {/* Weight in Grams */}
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Weight (Grams / pc) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  value={sizeData.grams}
                  onChange={(e) => {
                    const g = e.target.value === '' ? '' : Number(e.target.value);
                    setSizeData({
                      ...sizeData,
                      grams: g,
                      weightKg: typeof g === 'number' ? Number((g / 1000).toFixed(3)) : 0,
                    });
                  }}
                  placeholder="300"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-body-md font-mono font-bold text-secondary focus:border-secondary focus:bg-surface-container-lowest outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-secondary pointer-events-none">
                  g
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                = {(Number(sizeData.grams || 0) / 1000).toFixed(3)} kg / piece
              </p>
            </div>

            {/* GSM */}
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Fabric GSM *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={100}
                  max={1200}
                  value={sizeData.gsm}
                  onChange={(e) => setSizeData({ ...sizeData, gsm: Number(e.target.value) })}
                  placeholder="600"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-body-md font-mono font-bold text-primary focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-on-surface-variant pointer-events-none">
                  GSM
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Density grams / m²</p>
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Wholesale Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-primary pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min={0}
                  value={sizeData.price}
                  onChange={(e) => setSizeData({ ...sizeData, price: Number(e.target.value) })}
                  placeholder="220"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-7 pr-3 py-2.5 text-body-md font-mono font-bold text-primary focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Per piece (ex-mill)</p>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-label-sm font-bold text-primary mb-1">
                Warehouse Stock (pcs) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  value={sizeData.stock}
                  onChange={(e) => setSizeData({ ...sizeData, stock: Number(e.target.value) })}
                  placeholder="350"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-body-md font-mono font-bold text-primary focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-on-surface-variant pointer-events-none">
                  pcs
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Available inventory</p>
            </div>
          </div>

          {/* Unit Spec Live Preview Card */}
          <div className="bg-surface-container-low/80 border border-outline-variant rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold font-mono text-sm">
                1x
              </div>
              <div>
                <p className="text-body-sm font-bold text-primary">
                  {formData.title || 'Product'} • {sizeData.dimension || '50x100 cm'}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {sizeData.grams}g weight • {sizeData.gsm} GSM • {formData.weaveType} • {formData.material}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Unit Price</p>
                <p className="text-title-sm font-bold text-primary font-mono">₹{sizeData.price || 0} <span className="text-xs font-normal text-on-surface-variant">/pc</span></p>
              </div>
              <div className="border-l border-outline-variant pl-4">
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Inventory Value</p>
                <p className="text-title-sm font-bold text-secondary font-mono">₹{((Number(sizeData.price) || 0) * (Number(sizeData.stock) || 0)).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Submission Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-error-container text-on-error-container hover:bg-error hover:text-white rounded-lg font-label-md font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              <span>Deactivate Product</span>
            </button>
          ) : (
            <Link
              to="/admin/products"
              className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-md font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </Link>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary-container hover:bg-primary text-white rounded-lg font-label-lg font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Product...</span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                <span>{isEdit ? 'Update Product & Photos' : 'Publish Product to Catalog'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
