import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * UploadProgress Component
 * Visualizes upload percentage, loaded/total bytes, and transmission rate
 */
export const UploadProgress = ({
  progress = 0,
  loadedBytes = 0,
  totalBytes = 0,
  fileName = '',
  statusText = 'Uploading...',
  className = '',
}) => {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isDone = progress >= 100;

  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-elevated border border-white/10 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 max-w-[70%]">
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          )}
          <span className="font-semibold text-content-primary truncate font-mono">
            {fileName || statusText}
          </span>
        </div>
        <span className="font-mono font-bold text-xs text-primary">
          {progress}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-surface-base overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent-cyan rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-content-muted">
        <span>{statusText}</span>
        {totalBytes > 0 && (
          <span className="font-mono text-[10px]">
            {formatBytes(loadedBytes)} / {formatBytes(totalBytes)}
          </span>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;
