import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import api from '../api/axios';

const sampleImages = [
  {
    label: "Front Side - Crisp White Towel",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCdKqsvfuy2yau3AySGBI8zrrt1U9ghlW3X5wsoSzGBmztb7AyEZEhYV6EL6hsHNIBYMWtdL482GVLBRWvqbV0yTmpIlrmoJph838qaVWq9l1eDuxkE1I__-yKdS3oaLCCRrHpvWejMDeHWnT87rkOyHa0EKZu56Gbw6hoaMcb3hM9wIo5pCxDGGx6g7JtSEJY9wy9ZOXaAhzH4nphAIFBcgFZ6Bb85_5NECSf6XaYsx6x0NyYuSCwXw"
  },
  {
    label: "Back Side / Folded Stack",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4G6yJKWXrsFcKnRVjY4iUeQqaDk4bnROUb1QZsoFAMBBxbVCMHmiGkwcXOhvfDMxeuAHEPpxaM-hZxHrTfmx3zka_ed-0v15OyyV0sSW4oWhC9VzT8M8cxOkv9BX9Hd-f9-Gi5XmB1SqNGEIhriYPqsbo_hEcLU8WZEo_fcNleWS1-uA6bKz7nLhIayTVKmcOwq6fJZn2kaA_GRkWOXz0dUrsNFQH3IO9lAE2TAC3he6E378VTZmQaA"
  },
  {
    label: "Fabric Texture / Loom Border",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoDYdD9ozOqIkie8Ri4dtlGbS54d2Pyh1nFBU5yIIRZB5DJvm3ql4Y858m1_4WsL3K0A4cLOxTIG6fNWzBJZ_QI6WZkhnWDmTQsm1mY-TBGsDrhDUyssfPYFRf25byd1ojjtYFtp8i7AZ0cUCebRzVLdwV1XZ3T635MNtPTiHY_uu9TRt55-_B8qF--iLFVdULjBex9lnRvmRFiF5TZ6y3wUz8oWevpWo64cOO__kNWnCe5NrnuFBMrw"
  }
];

const SLOT_LABELS = [
  { title: "Front Side (Primary Cover)", desc: "Main product view shown on catalog & storefront cards", badge: "Front" },
  { title: "Back Side (Reverse View)", desc: "Reverse angle or folded perspective for buyers", badge: "Back" },
  { title: "Detail / Fabric Texture", desc: "Close-up of weave, terry loops, border hem or finish", badge: "Detail" },
  { title: "Additional Angle 4", desc: "Packaging, bundle or in-use angle", badge: "Angle 4" },
];

export const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createProduct, updateProduct, deleteProduct, getProductById } = useProducts();
  
  const multiFileInputRef = useRef(null);
  const singleSlotFileInputRef = useRef(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState(0);

  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'White Towels',
    hsnCode: '6302.60',
    gsmRange: '500 - 650 GSM',
    weaveType: '20s',
    material: 'Cotton',
    active: true,
  });

  // Multi-image list: slots for Front, Back, Detail etc.
  const [images, setImages] = useState([
    sampleImages[0].url,
    sampleImages[1].url,
  ]);

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [imageSourceMode, setImageSourceMode] = useState('UPLOAD'); // 'UPLOAD' | 'PRESETS' | 'URL'
  const [urlInputVal, setUrlInputVal] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic sizes list state
  const [sizes, setSizes] = useState([
    {
      id: `sz-init-1`,
      size: '25x50',
      dimension: '25x50 cm',
      widthCm: 25,
      lengthCm: 50,
      price: 80,
      stock: 100,
      gsm: 500,
      grams: 63,
      weightKg: 0.063,
    },
    {
      id: `sz-init-2`,
      size: '30x60',
      dimension: '30x60 cm',
      widthCm: 30,
      lengthCm: 60,
      price: 120,
      stock: 250,
      gsm: 550,
      grams: 99,
      weightKg: 0.099,
    },
    {
      id: `sz-init-3`,
      size: '40x80',
      dimension: '40x80 cm',
      widthCm: 40,
      lengthCm: 80,
      price: 160,
      stock: 150,
      gsm: 600,
      grams: 192,
      weightKg: 0.192,
    }
  ]);

  // Form state for adding a dynamic size
  const [newSizeForm, setNewSizeForm] = useState({
    widthCm: 50,
    lengthCm: 90,
    gsm: 550,
    grams: 248,
    price: 180,
    stock: 120,
  });

  const [showAddSizeDrawer, setShowAddSizeDrawer] = useState(false);

  const handleDimensionOrGsmChange = (field, val) => {
    const updated = { ...newSizeForm, [field]: val };
    const w = Number(field === 'widthCm' ? val : updated.widthCm) || 0;
    const l = Number(field === 'lengthCm' ? val : updated.lengthCm) || 0;
    const g = Number(field === 'gsm' ? val : updated.gsm) || 500;
    if (w > 0 && l > 0 && g > 0) {
      updated.grams = Math.max(10, Math.round((w * l * g) / 10000));
    }
    setNewSizeForm(updated);
  };

  // Load product if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchProductDetail = async () => {
        setLoadingProduct(true);
        try {
          const res = await getProductById(id);
          if (res && (res.success || res.product)) {
            const p = res.product || res;
            setFormData({
              title: p.name || p.title || '',
              subtitle: p.description || p.subtitle || '',
              category: p.category || 'White Towels',
              hsnCode: p.hsnCode || '6302.60',
              gsmRange: p.gsmRange || '500 - 650 GSM',
              weaveType: p.weaveType || '20s',
              material: p.material || 'Cotton',
              active: p.active !== false,
            });

            // Set images array
            const productImages = (p.images && p.images.length > 0)
              ? p.images
              : (p.image ? [p.image] : [sampleImages[0].url]);
            
            setImages(productImages);
            setActivePreviewIndex(0);

            if (p.sizes && p.sizes.length > 0) {
              setSizes(p.sizes.map(s => {
                const g = s.grams || Math.round((s.weightKg || 0.1) * 1000);
                return {
                  id: s._id || s.id,
                  _id: s._id || s.id,
                  size: s.size,
                  dimension: `${s.size} cm`,
                  price: s.price,
                  stock: s.stock,
                  gsm: s.gsm || 500,
                  grams: g,
                  weightKg: s.weightKg || Number((g / 1000).toFixed(3)),
                };
              }));
            }
          }
        } catch (err) {
          console.warn('[ProductForm] Notice loading product detail:', err);
        } finally {
          setLoadingProduct(false);
        }
      };

      fetchProductDetail();
    }
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

  // Handle multiple files upload (drag & drop or multi-picker)
  const handleBatchFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 4); // up to 4 images
    const optimized = await Promise.all(files.map((f) => optimizeImage(f)));
    const valid = optimized.filter(Boolean);

    if (valid.length > 0) {
      setImages((prev) => {
        // If replacing everything on drop/upload or appending
        const newArr = [...valid];
        return newArr;
      });
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
    // reset input
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

  // Set an image as primary / front cover
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

  // Remove an image slot
  const handleRemoveImage = (index) => {
    if (images.length <= 1) {
      alert("A product requires at least 1 image (Front view).");
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    setActivePreviewIndex(0);
  };

  // Add a new empty or preset slot
  const handleAddSlot = () => {
    if (images.length >= 4) {
      alert("Maximum 4 images allowed per product (Front, Back, Detail, Extra).");
      return;
    }
    const nextPreset = sampleImages[images.length] ? sampleImages[images.length].url : sampleImages[0].url;
    setImages([...images, nextPreset]);
    setActivePreviewIndex(images.length);
  };

  // Add new dynamic size row to list
  const handleAddNewSizeRow = (e) => {
    e.preventDefault();
    const width = Number(newSizeForm.widthCm);
    const length = Number(newSizeForm.lengthCm);
    const gsm = Number(newSizeForm.gsm) || 500;
    const price = Number(newSizeForm.price);
    const stock = Number(newSizeForm.stock);
    const grams = Number(newSizeForm.grams) || Math.max(10, Math.round((width * length * gsm) / 10000));

    const sizeKey = `${width}x${length}`;

    // Prevent duplicate size in local form list
    const isDuplicate = sizes.some(s => {
      const clean = String(s.size || s.dimension || '')
        .toLowerCase()
        .replace(/cm|inch|in/gi, '')
        .replace(/[×*X]/g, 'x')
        .replace(/\s+/g, '')
        .trim();
      return clean === sizeKey;
    });

    if (isDuplicate) {
      alert(`⚠️ Size "${sizeKey}" (${width}x${length} cm) is already added in the list. Duplicate towel sizes are not allowed.`);
      return;
    }

    const calculatedWeight = Number((grams / 1000).toFixed(3));

    const newSizeItem = {
      id: `sz-${Date.now()}`,
      size: sizeKey,
      dimension: `${sizeKey} cm`,
      widthCm: width,
      lengthCm: length,
      gsm: gsm,
      grams: grams,
      price: price,
      stock: stock,
      weightKg: calculatedWeight,
    };

    setSizes([...sizes, newSizeItem]);
    setShowAddSizeDrawer(false);

    // Reset add size form
    setNewSizeForm({
      widthCm: 60,
      lengthCm: 100,
      gsm: 600,
      grams: 360,
      price: 220,
      stock: 100,
    });
  };

  // Remove size from list
  const handleRemoveSizeRow = (sizeId) => {
    if (sizes.length <= 1) {
      alert("A product must have at least one dynamic size specification.");
      return;
    }
    setSizes(sizes.filter(s => s.id !== sizeId && s._id !== sizeId));
  };

  // Quick edit a field in a size row
  const handleUpdateSizeRow = (sizeId, fieldOrUpdates, value) => {
    setSizes((prevSizes) =>
      prevSizes.map((s) => {
        if (s.id !== sizeId && s._id !== sizeId) return s;
        if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
          return { ...s, ...fieldOrUpdates };
        }
        return { ...s, [fieldOrUpdates]: value };
      })
    );
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage("Product title/name is required.");
      return;
    }

    const validImages = images.filter(Boolean);
    if (validImages.length === 0) {
      setErrorMessage("Please upload at least 1 product image (Front Side).");
      return;
    }

    if (sizes.length === 0) {
      setErrorMessage("Please configure at least one dynamic size for this product.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.title.trim(),
      title: formData.title.trim(),
      description: formData.subtitle.trim(),
      category: formData.category,
      hsnCode: formData.hsnCode,
      weaveType: formData.weaveType,
      material: formData.material,
      images: validImages,
      image: validImages[0],
      active: formData.active,
      sizes: sizes.map(s => {
        const grams = Number(s.grams) || Math.round(Number(s.weightKg || 0.1) * 1000);
        return {
          _id: s._id,
          size: s.size,
          price: Number(s.price),
          stock: Number(s.stock),
          gsm: Number(s.gsm || 500),
          grams: grams,
          weightKg: Number((grams / 1000).toFixed(3)),
          active: true,
        };
      })
    };

    let result;
    if (isEdit) {
      result = await updateProduct(id, payload);
    } else {
      result = await createProduct(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      navigate('/admin/products');
    } else {
      setErrorMessage(result.error || 'Failed to save product to MongoDB.');
    }
  };

  // Delete product action
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

  if (loadingProduct) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Loading product data...</p>
      </div>
    );
  }

  const currentPreviewImage = images[activePreviewIndex] || images[0] || sampleImages[0].url;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
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

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Link to="/admin/products" className="text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-headline-sm font-bold text-primary">
              {isEdit ? `Edit Product: ${formData.title || 'Towel'}` : 'Create New Towel Product'}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Upload 2 to 3 photos (Front view, Back view, Detail texture) for full-width buyer store display.
            </p>
          </div>
        </div>

        <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {sizes.length} Sizes • {images.length} Photos
        </span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. PRODUCT PHOTOS (MULTI-IMAGE: FRONT, BACK, DETAIL) */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-title-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-lg">photo_library</span>
                1. Product Photography (2 to 3 Angles for Buyer Store)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Upload Front side, Back side, and Detail views. Full-width rendered on the buyer store.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Upload 2-3 Photos at Once</span>
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

          {/* Master Full-Width Preview & Angle Slots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Full Width Image Preview */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Active Full-Width Preview: {SLOT_LABELS[activePreviewIndex]?.badge || `Photo ${activePreviewIndex + 1}`}
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
                  onError={(e) => { e.target.src = sampleImages[0].url; }}
                />

                {/* Floating Overlay Badge */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-secondary-fixed">verified</span>
                  <span>{SLOT_LABELS[activePreviewIndex]?.title || `Angle ${activePreviewIndex + 1}`}</span>
                </div>

                {activePreviewIndex === 0 && (
                  <div className="absolute top-3 right-3 bg-secondary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
                    MAIN STORE COVER
                  </div>
                )}

                {/* Action Buttons on Hover */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-black/60 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Click slots below to switch or edit</span>
                  <button
                    type="button"
                    onClick={() => triggerSlotUpload(activePreviewIndex)}
                    className="px-2.5 py-1 bg-white text-primary text-xs font-bold rounded-md hover:bg-surface-container transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                    Replace Photo
                  </button>
                </div>
              </div>

              {/* Drag & Drop Quick Zone */}
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
                  Drag &amp; drop 2 to 3 image files here or <span className="text-secondary font-bold underline">click to browse</span>
                </p>
              </div>
            </div>

            {/* Right: Angle Slots (Front, Back, Detail) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md font-bold text-primary">
                  Configured Product Angles ({images.length} / 4)
                </span>
                <span className="text-[11px] text-outline">Drag/click to manage</span>
              </div>

              <div className="space-y-2.5">
                {images.map((imgUrl, idx) => {
                  const labelInfo = SLOT_LABELS[idx] || {
                    title: `Additional Angle ${idx + 1}`,
                    desc: 'Extra view for towel specification',
                    badge: `Angle ${idx + 1}`
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
                      {/* Thumbnail (Full width within box) */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-surface-container border border-outline-variant shrink-0 relative">
                        <img
                          src={imgUrl}
                          alt={labelInfo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = sampleImages[0].url; }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold py-0.2 text-center uppercase tracking-wider truncate">
                          {labelInfo.badge}
                        </span>
                      </div>

                      {/* Info & Slot Controls */}
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
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                          {labelInfo.desc}
                        </p>

                        {/* Actions */}
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
                                Set as Front Cover
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

              {/* Mode Switch for Presets / Direct URL */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex rounded-lg border border-outline-variant p-0.5 bg-surface-container-low text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('UPLOAD')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'UPLOAD' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">upload_file</span>
                    <span>Upload Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('PRESETS')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'PRESETS' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">collections</span>
                    <span>Studio Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('URL')}
                    className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition-all ${
                      imageSourceMode === 'URL' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">link</span>
                    <span>Web URL</span>
                  </button>
                </div>

                {imageSourceMode === 'PRESETS' && (
                  <div className="mt-2.5 p-2 bg-surface-container-low rounded-xl border border-outline-variant space-y-1.5">
                    <span className="text-[11px] font-bold text-on-surface-variant block">
                      Apply Studio Preset to slot: <strong>{SLOT_LABELS[activePreviewIndex]?.badge || `Slot ${activePreviewIndex + 1}`}</strong>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {sampleImages.map((img, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setImages(prev => {
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
                    <span className="text-[11px] font-bold text-on-surface-variant block">
                      Paste Image Link for <strong>{SLOT_LABELS[activePreviewIndex]?.title}</strong>:
                    </span>
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
                            setImages(prev => {
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

        {/* 2. BASIC PRODUCT SPECIFICATIONS */}
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
                placeholder="e.g. White Towel"
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
                placeholder="e.g. house use / hotel institutional terry towel"
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
                placeholder="Cotton"
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
                placeholder="20s"
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

          {/* Product Publishing Status */}
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

        {/* 3. DYNAMIC SIZES, PRICING & STOCK AVAILABILITY MATRIX */}
        <section className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-title-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-lg">straighten</span>
                3. Dynamic Sizes, Pricing &amp; Stock Availability
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Configure dynamic dimensions (e.g. 25x50, 30x60, 40x80, 50x90), piece price (₹), and warehouse stock.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSizeDrawer(!showAddSizeDrawer)}
              className="bg-primary-container text-white px-3.5 py-1.5 rounded-lg text-label-md font-bold hover:bg-primary transition-colors flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{showAddSizeDrawer ? 'Close Form' : 'Add Dynamic Size'}</span>
            </button>
          </div>

          {/* ADD SIZE INLINE FORM */}
          {showAddSizeDrawer && (
            <div className="bg-surface-container-low p-4 rounded-xl border-2 border-primary/20 space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="font-bold text-primary text-label-md uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  New Dynamic Size (Free-form cm)
                </span>
                <span className="text-label-sm text-secondary font-bold font-mono">Direct Mill Specs</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Width (cm) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={300}
                    value={newSizeForm.widthCm}
                    onChange={(e) => handleDimensionOrGsmChange('widthCm', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-body-sm text-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Length (cm) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={400}
                    value={newSizeForm.lengthCm}
                    onChange={(e) => handleDimensionOrGsmChange('lengthCm', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-body-sm text-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Weight (Grams / grms) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newSizeForm.grams}
                    onChange={(e) => setNewSizeForm({ ...newSizeForm, grams: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-body-sm text-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Price (₹ / pc) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newSizeForm.price}
                    onChange={(e) => setNewSizeForm({ ...newSizeForm, price: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-body-sm text-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1">
                    Stock (pcs) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newSizeForm.stock}
                    onChange={(e) => setNewSizeForm({ ...newSizeForm, stock: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 font-mono text-body-sm text-primary font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddNewSizeRow}
                  className="px-4 py-2 bg-primary text-white text-label-md font-bold rounded-lg shadow-sm hover:bg-primary-container active:scale-95 transition-all"
                >
                  Insert Size ({newSizeForm.widthCm}x{newSizeForm.lengthCm} • {newSizeForm.grams}g)
                </button>
              </div>
            </div>
          )}

          {/* SIZES TABLE / LIST */}
          <div className="overflow-x-auto border border-outline-variant rounded-xl bg-surface-container-lowest">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-label-sm font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="p-3">Size Dimension</th>
                  <th className="p-3">Weight (Grams / grms)</th>
                  <th className="p-3">Price (₹ / pc)</th>
                  <th className="p-3">Warehouse Stock (pcs)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {sizes.map((size) => (
                  <tr key={size.id || size._id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-bold text-primary">
                      {size.size || size.dimension}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={size.grams !== undefined && size.grams !== null ? size.grams : Math.round((size.weightKg || 0.1) * 1000)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const g = val === '' ? '' : Number(val);
                            handleUpdateSizeRow(size.id || size._id, {
                              grams: g,
                              weightKg: typeof g === 'number' ? Number((g / 1000).toFixed(3)) : 0,
                            });
                          }}
                          className="w-20 bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs font-mono font-bold text-secondary"
                        />
                        <span className="text-xs font-bold text-on-surface-variant">g</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          min={0}
                          value={size.price}
                          onChange={(e) => handleUpdateSizeRow(size.id || size._id, 'price', Number(e.target.value))}
                          className="w-24 bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs font-mono font-bold text-primary"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={size.stock}
                        onChange={(e) => handleUpdateSizeRow(size.id || size._id, 'stock', Number(e.target.value))}
                        className="w-24 bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs font-mono font-bold"
                      /> pcs
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeRow(size.id || size._id)}
                        className="p-1.5 text-error hover:bg-error-container/40 rounded-lg transition-colors"
                        title="Remove Size"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM SUBMISSION ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-error-container text-on-error-container hover:bg-error hover:text-white rounded-lg font-label-md font-bold transition-colors flex items-center gap-1"
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
            className="px-6 py-3 bg-primary-container hover:bg-primary text-white rounded-lg font-label-lg font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving to MongoDB...</span>
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
