import React from 'react';
import { Trash2, Smartphone } from 'lucide-react';

/**
 * ImagePreview Component
 * Renders thumbnail with delete action and aspect ratio enclosure
 */
export const ImagePreview = ({
  src,
  alt = 'Preview',
  onRemove,
  aspectRatio = 'square', // 'square', 'video', 'portrait'
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
}) => {
  if (!src) {
    return (
      <div
        className={`rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center text-content-dim ${
          aspectRatio === 'square' ? 'w-20 h-20' : 'w-full h-40'
        } ${className}`}
      >
        <Smartphone className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  const aspectClasses = {
    square: 'aspect-square w-24',
    portrait: 'aspect-[9/16] w-28',
    video: 'aspect-video w-48',
  }[aspectRatio] || 'w-24 h-24';

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-surface-elevated group flex-shrink-0 ${aspectClasses} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {onRemove && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 rounded-xl bg-accent-rose text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
