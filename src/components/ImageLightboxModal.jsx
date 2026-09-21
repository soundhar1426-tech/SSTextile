import React, { useState, useEffect } from 'react';

const getImageLabel = (index, total) => {
  if (index === 0) return 'Front View (Main)';
  if (index === 1) return 'Back / Reverse Side';
  if (index === 2) return 'Fabric & Texture Detail';
  return `View ${index + 1}`;
};

export const ImageLightboxModal = ({
  isOpen,
  onClose,
  images = [],
  imageSrc,
  imageAlt,
  title,
  subtitle,
  initialIndex = 0
}) => {
  // Normalize images list
  const imageList = Array.isArray(images) && images.length > 0 
    ? images.filter(Boolean) 
    : (imageSrc ? [imageSrc] : []);

  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      const validIndex = (initialIndex >= 0 && initialIndex < imageList.length) ? initialIndex : 0;
      setCurrentIndex(validIndex);
    }
  }, [isOpen, initialIndex, imageList.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, imageList.length]);

  if (!isOpen || imageList.length === 0) return null;

  const currentImage = imageList[currentIndex] || imageList[0];
  const hasMultiple = imageList.length > 1;

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center bg-surface-container-lowest/95 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="w-full px-4 py-3 bg-primary-container text-white flex items-center justify-between border-b border-primary/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined text-secondary-fixed text-xl">photo_library</span>
            <div className="truncate">
              <h3 className="font-bold text-body-md text-white truncate leading-tight flex items-center gap-2">
                <span>{title || 'Product Photo Preview'}</span>
                {hasMultiple && (
                  <span className="bg-white/20 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {currentIndex + 1} / {imageList.length} • {getImageLabel(currentIndex, imageList.length)}
                  </span>
                )}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-primary-fixed truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentImage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Open full resolution in new tab"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span className="hidden sm:inline">Original</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95"
              aria-label="Close photo preview"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Full Image Display Container with Navigation */}
        <div className="relative w-full flex-1 min-h-[320px] max-h-[70vh] p-2 sm:p-4 bg-[#0a0f1d]/60 flex items-center justify-center overflow-hidden select-none">
          {/* Previous Arrow Button */}
          {hasMultiple && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-all active:scale-90 border border-white/20 hover:scale-105"
              title="Previous photo (Left Arrow)"
              aria-label="Previous photo"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}

          {/* Current Image */}
          <img
            src={currentImage}
            alt={imageAlt || title || `Product View ${currentIndex + 1}`}
            className="max-w-full max-h-[68vh] w-auto h-auto object-contain rounded-lg shadow-xl border border-outline-variant/30 transition-all duration-200"
          />

          {/* Next Arrow Button */}
          {hasMultiple && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-all active:scale-90 border border-white/20 hover:scale-105"
              title="Next photo (Right Arrow)"
              aria-label="Next photo"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}
        </div>

        {/* Multi-Image Thumbnail Strip (Front / Back / Texture) */}
        {hasMultiple && (
          <div className="w-full px-4 py-2 bg-surface-container-low border-t border-outline-variant flex items-center justify-center gap-2 overflow-x-auto">
            {imageList.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center bg-surface-container ${
                  currentIndex === idx
                    ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                    : 'border-outline-variant/60 opacity-60 hover:opacity-100 hover:border-primary/50'
                }`}
                title={getImageLabel(idx, imageList.length)}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold py-0.2 text-center uppercase tracking-wider truncate px-0.5">
                  {idx === 0 ? 'Front' : idx === 1 ? 'Back' : `Angle ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Bar Info */}
        <div className="w-full px-4 py-2 bg-surface-container border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
            Direct Mill High-Resolution Photo • {getImageLabel(currentIndex, imageList.length)}
          </span>
          <span className="text-[11px] text-outline font-medium">
            {hasMultiple ? 'Use ← → keys to switch • ' : ''}Press <kbd className="px-1.5 py-0.5 bg-surface-container-high rounded border border-outline-variant font-mono text-[10px]">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageLightboxModal;
