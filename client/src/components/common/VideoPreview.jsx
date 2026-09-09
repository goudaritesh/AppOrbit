import React from 'react';
import { Trash2, Video, Play } from 'lucide-react';

/**
 * VideoPreview Component
 * Renders both direct uploaded HTML5 video files and YouTube/Vimeo embeds
 */
export const VideoPreview = ({
  video,
  onRemove,
  className = '',
}) => {
  if (!video || !video.url) {
    return null;
  }

  const isYouTube =
    video.type === 'youtube' ||
    video.provider === 'youtube' ||
    video.url.includes('youtube.com') ||
    video.url.includes('youtu.be');

  const isVimeo =
    video.type === 'vimeo' ||
    video.provider === 'vimeo' ||
    video.url.includes('vimeo.com');

  const getYouTubeEmbedUrl = (rawUrl) => {
    try {
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      const urlObj = new URL(rawUrl);
      const v = urlObj.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    } catch {
      // Fallback
    }
    return rawUrl;
  };

  const getVimeoEmbedUrl = (rawUrl) => {
    try {
      const match = rawUrl.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    } catch {
      // Fallback
    }
    return rawUrl;
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-surface-elevated ${className}`}>
      <div className="aspect-video w-full bg-black/60 flex items-center justify-center">
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(video.url)}
            title="Demo Video Preview"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isVimeo ? (
          <iframe
            src={getVimeoEmbedUrl(video.url)}
            title="Vimeo Demo Preview"
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            controls
            src={video.url}
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-accent-rose text-white transition-colors backdrop-blur-md shadow-lg"
          title="Remove video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default VideoPreview;
