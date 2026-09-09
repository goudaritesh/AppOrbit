import React, { useEffect } from 'react';
import { X, Play } from 'lucide-react';

/**
 * Extracts YouTube video ID safely from standard URLs
 */
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&rel=0`
    : null;
};

/**
 * Secure Demo Video player modal
 */
export const DemoVideoModal = ({ isOpen, onClose, demoVideo, appName = 'Application' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !demoVideo || !demoVideo.url) return null;

  const embedUrl =
    demoVideo.type === 'youtube' || demoVideo.provider === 'youtube'
      ? getYouTubeEmbedUrl(demoVideo.url)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-elevated">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading font-bold text-content-primary truncate">
              {appName} — Video Demo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-content-muted hover:text-white transition-colors"
            aria-label="Close video modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Embed Frame */}
        <div className="relative aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${appName} Demo Video`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-content-muted">
              <p className="text-sm mb-4">Direct video streaming preview:</p>
              <a
                href={demoVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
              >
                Open External Video Stream
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoVideoModal;
