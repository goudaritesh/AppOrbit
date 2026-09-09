import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileArchive,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { versionApi } from '../../api/versionApi';

/**
 * APK Upload Zone Component
 * Features drag-and-drop, client-side validation, live upload progress,
 * and background processing transition.
 */
export const APKUploadZone = ({ appId, onUploadSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [versionName, setVersionName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleValidateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.apk')) {
      setError('Invalid file type: Selected file must have a .apk extension.');
      return;
    }

    const maxBytes = 200 * 1024 * 1024; // 200MB
    if (selectedFile.size > maxBytes) {
      setError(`File size (${formatFileSize(selectedFile.size)}) exceeds the platform ceiling of 200 MB.`);
      return;
    }

    if (selectedFile.size === 0) {
      setError('File is empty (0 bytes). Please select a valid compiled APK.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadStatusText('Transferring binary artifact to secure storage...');

    try {
      const formData = new FormData();
      formData.append('apk', file);
      if (versionName.trim()) {
        formData.append('versionName', versionName.trim());
      }
      if (releaseNotes.trim()) {
        formData.append('releaseNotes', releaseNotes.trim());
      }

      const res = await versionApi.uploadApk(
        appId,
        formData,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
            setLoadedBytes(progressEvent.loaded);
            setTotalBytes(progressEvent.total);

            if (percent >= 100) {
              setUploadStatusText('Upload complete! Extracting Android manifest and computing SHA-256...');
            }
          }
        }
      );

      if (res?.data?.version) {
        if (onUploadSuccess) {
          onUploadSuccess(res.data.version);
        }
      }
    } catch (err) {
      console.error('APK upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload APK file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-surface-low/80 backdrop-blur-md shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-content-primary">
              Upload New APK Version
            </h3>
            <p className="text-xs text-content-secondary">
              Upload compiled Android package archive (.apk) for integrity validation & manifest extraction.
            </p>
          </div>
        </div>
        {onCancel && !uploading && (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-content-dim hover:text-content-primary hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* File Dropzone */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-accent-cyan bg-accent-cyan/5 scale-[0.99]'
              : 'border-white/15 hover:border-white/30 bg-surface/40 hover:bg-surface/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            className="hidden"
            onChange={(e) => handleValidateAndSetFile(e.target.files?.[0])}
          />
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-content-dim group-hover:text-white transition-colors">
            <FileArchive className="w-7 h-7 text-accent-cyan" />
          </div>
          <p className="font-heading font-semibold text-sm text-content-primary mb-1">
            Drag & drop your APK file here, or <span className="text-accent-cyan underline">browse</span>
          </p>
          <p className="text-xs text-content-dim font-mono">
            Supported format: .apk (Max limit: 200 MB)
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Selected File Card */}
          <div className="p-4 rounded-xl bg-surface border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{file.name}</p>
                <p className="text-xs text-content-dim font-mono">{formatFileSize(file.size)}</p>
              </div>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setProgress(0);
                }}
                className="text-content-dim hover:text-rose-400"
              >
                Change File
              </Button>
            )}
          </div>

          {/* Optional Version Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Version Name Override (Optional)
              </label>
              <input
                type="text"
                disabled={uploading}
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Auto-extracted from AndroidManifest"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-content-primary placeholder:text-content-dim focus:outline-none focus:border-accent-cyan"
              />
              <p className="text-[11px] text-content-dim mt-1">
                Leave empty to use value declared inside APK manifest.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Release Notes (What's new in this build)
              </label>
              <textarea
                disabled={uploading}
                rows={2}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="e.g., Bug fixes, performance improvements, and BLE telemetry updates..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-xs text-content-primary placeholder:text-content-dim focus:outline-none focus:border-accent-cyan resize-none"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="p-4 rounded-xl bg-surface border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-content-primary flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-cyan" />
                  <span>{uploadStatusText}</span>
                </span>
                <span className="font-mono text-accent-cyan font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-content-dim font-mono">
                <span>{formatFileSize(loadedBytes)} of {formatFileSize(totalBytes)}</span>
                <span>Isolated Private Storage</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <Button variant="outline" size="md" disabled={uploading} onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              loading={uploading}
              onClick={handleUpload}
              icon={<UploadCloud className="w-4 h-4" />}
            >
              Upload & Process APK
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default APKUploadZone;
