import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, File } from 'lucide-react';

/**
 * Reusable Drag and Drop File Uploader Component
 */
export const DragDropUploader = ({
  onFilesSelected,
  accept = 'image/*',
  maxSizeMb = 10,
  multiple = false,
  title = 'Drag & drop files here',
  description = 'or click to browse from your computer',
  icon: CustomIcon,
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateAndProcessFiles = (fileList) => {
    setError(null);
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const maxBytes = maxSizeMb * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxBytes) {
        setError(`"${file.name}" exceeds the maximum limit of ${maxSizeMb} MB (${formatSize(file.size)})`);
        return;
      }
    }

    if (onFilesSelected) {
      onFilesSelected(multiple ? files : files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
      // Reset input value to allow re-selecting same file
      e.target.value = '';
    }
  };

  const triggerSelect = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const IconToRender = CustomIcon || UploadCloud;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerSelect}
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-white/10 hover:border-white/20 bg-surface-elevated/40 hover:bg-surface-elevated/70'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center mb-3 text-primary shadow-inner">
          <IconToRender className="w-6 h-6" />
        </div>

        <p className="text-xs font-semibold text-content-primary text-center">
          {title}
        </p>
        <p className="text-[11px] text-content-muted text-center mt-0.5">
          {description}
        </p>

        <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-content-dim bg-surface-base/80 px-2.5 py-1 rounded-full border border-white/5">
          <span>Max {maxSizeMb} MB</span>
          <span>•</span>
          <span>{accept.replace(/\/\*/g, '')}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DragDropUploader;
