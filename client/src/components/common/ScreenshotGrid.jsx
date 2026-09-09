import React, { useState } from 'react';
import { Trash2, ZoomIn, ArrowLeft, ArrowRight, X } from 'lucide-react';

/**
 * ScreenshotGrid Component
 * Displays grid of uploaded screenshots with delete, reorder, and zoom preview modal
 */
export const ScreenshotGrid = ({
  screenshots = [],
  onDelete,
  onReorder,
  className = '',
}) => {
  const [activeZoomUrl, setActiveZoomUrl] = useState(null);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handleMove = (fromIdx, toIdx) => {
    if (!onReorder) return;
    if (toIdx < 0 || toIdx >= screenshots.length) return;
    const updated = [...screenshots];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onReorder(updated);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-content-primary">
          Uploaded Screenshots ({screenshots.length} / 10)
        </span>
        <span className="text-[11px] font-mono text-content-dim">
          Drag or use arrows to reorder
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {screenshots.map((shot, idx) => {
          const shotUrl = typeof shot === 'string' ? shot : shot.url;
          const shotId = shot._id || shot.id || idx;

          return (
            <div
              key={shotId}
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-surface-elevated border border-white/10 shadow-sm transition-all hover:border-white/30"
            >
              <img
                src={shotUrl}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Order Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                #{idx + 1}
              </div>

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 backdrop-blur-xs">
                {/* Top Action: Zoom & Delete */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveZoomUrl(shotUrl)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Zoom screenshot"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(idx, shotId)}
                      className="p-1.5 rounded-lg bg-accent-rose/80 hover:bg-accent-rose text-white transition-colors"
                      title="Delete screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bottom Action: Reorder Arrows */}
                {onReorder && screenshots.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg bg-black/40">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, idx - 1)}
                      className={`p-1 rounded text-white ${
                        idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'
                      }`}
                      title="Move left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === screenshots.length - 1}
                      onClick={() => handleMove(idx, idx + 1)}
                      className={`p-1 rounded text-white ${
                        idx === screenshots.length - 1
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/20'
                      }`}
                      title="Move right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal */}
      {activeZoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveZoomUrl(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeZoomUrl}
              alt="Screenshot Zoom"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotGrid;
