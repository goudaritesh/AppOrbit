import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Accessible Lightbox modal for full-size screenshot preview
 */
export const ScreenshotModal = ({
  isOpen,
  onClose,
  screenshots = [],
  currentIndex = 0,
  setCurrentIndex,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, screenshots.length, setCurrentIndex]);

  if (!isOpen || !screenshots.length) return null;

  const currentScreenshot = screenshots[currentIndex] || screenshots[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
        <div className="text-xs font-mono text-white/70 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
          {currentIndex + 1} / {screenshots.length}
          {currentScreenshot.alt && ` — ${currentScreenshot.alt}`}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Preview Container */}
      <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center">
        <img
          src={currentScreenshot.url}
          alt={currentScreenshot.alt || 'Application Screenshot'}
          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />

        {/* Previous Button */}
        {screenshots.length > 1 && (
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1))
            }
            className="absolute left-2 -translate-x-4 sm:-translate-x-12 p-3 rounded-full bg-surface-elevated/80 hover:bg-surface-elevated border border-white/10 text-white transition-all shadow-lg hover:scale-105"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {screenshots.length > 1 && (
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-2 translate-x-4 sm:translate-x-12 p-3 rounded-full bg-surface-elevated/80 hover:bg-surface-elevated border border-white/10 text-white transition-all shadow-lg hover:scale-105"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail Strip (if multiple) */}
      {screenshots.length > 1 && (
        <div className="absolute bottom-4 inset-x-4 flex justify-center gap-2 overflow-x-auto py-2">
          {screenshots.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/40 scale-105'
                  : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={s.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScreenshotModal;
