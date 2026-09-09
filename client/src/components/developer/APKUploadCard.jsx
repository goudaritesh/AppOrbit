import React, { useState } from 'react';
import {
  FileCode,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Hash,
  Layers,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import DragDropUploader from '../common/DragDropUploader';
import UploadProgress from '../common/UploadProgress';
import Button from '../ui/Button';

/**
 * APKUploadCard Component
 * Displays APK upload zone, upload progress, extracted metadata, and SHA-256 hash
 */
export const APKUploadCard = ({
  appId,
  currentApk,
  onUploadSuccess,
  onDeleteApk,
  disabled = false,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChosen = (file) => {
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('Please select a valid Android binary file (.apk)');
      return;
    }
    setSelectedFile(file);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setStatusText('Uploading APK to secure storage...');
    setError(null);

    try {
      // Dynamic import or passed handler
      const { uploadAppApk } = await import('../../api/developerPortalApi');
      const res = await uploadAppApk(
        appId,
        selectedFile,
        {
          versionName: versionName.trim() || undefined,
          releaseNotes: releaseNotes.trim() || undefined,
        },
        (pct, loaded, total) => {
          setProgress(pct);
          setLoadedBytes(loaded);
          setTotalBytes(total);
          if (pct === 100) {
            setStatusText('Validating APK headers & extracting metadata...');
          }
        }
      );

      setStatusText('APK verified and stored successfully!');
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(res.data?.apk || res.data?.version);
      }
    } catch (err) {
      console.error('APK upload failed:', err);
      setError(err.response?.data?.message || err.message || 'APK upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-5 rounded-2xl bg-surface-elevated border border-white/10 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">
              Android Package (APK) Binary
            </h3>
            <p className="text-[11px] text-content-muted">
              Securely uploaded, validated, and stored outside public web roots.
            </p>
          </div>
        </div>
        {currentApk && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Active Release
          </span>
        )}
      </div>

      {/* Current Stored APK Metadata */}
      {currentApk && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-base border border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold text-content-primary">
                {currentApk.fileName || currentApk.originalFileName || 'application.apk'}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-content-muted">
                <span>Version: <strong className="text-content-primary">{currentApk.version || currentApk.versionName || '1.0.0'}</strong></span>
                <span>•</span>
                <span>Size: <strong className="text-content-primary">{formatBytes(currentApk.size || currentApk.fileSize)}</strong></span>
                {currentApk.apkMetadata?.packageName && (
                  <>
                    <span>•</span>
                    <span>Package: <strong className="text-content-primary">{currentApk.apkMetadata.packageName}</strong></span>
                  </>
                )}
              </div>
            </div>

            {onDeleteApk && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteApk}
                className="text-accent-rose hover:bg-accent-rose/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* SHA-256 Digest Badge */}
          {(currentApk.sha256 || currentApk.fileHash) && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-elevated/70 border border-white/5 text-[10px] font-mono text-content-muted overflow-hidden">
              <Hash className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
              <span className="flex-shrink-0 font-semibold text-content-secondary">SHA-256:</span>
              <span className="truncate text-content-dim select-all">
                {currentApk.sha256 || currentApk.fileHash}
              </span>
            </div>
          )}

          {/* SDK Targets */}
          {currentApk.apkMetadata && (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-content-muted">
              <div className="p-2 rounded-lg bg-surface-elevated/40 border border-white/5">
                Min SDK: <strong className="text-content-primary">{currentApk.apkMetadata.minSdkVersion || 'API 21'}</strong>
              </div>
              <div className="p-2 rounded-lg bg-surface-elevated/40 border border-white/5">
                Target SDK: <strong className="text-content-primary">{currentApk.apkMetadata.targetSdkVersion || 'API 34'}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone / Replacement */}
      {!uploading && !selectedFile && (
        <DragDropUploader
          accept=".apk,application/vnd.android.package-archive"
          maxSizeMb={200}
          title={currentApk ? 'Upload New APK Version' : 'Drag & drop compiled APK'}
          description="Supports up to 200 MB .apk files"
          icon={UploadCloud}
          onFilesSelected={handleFileChosen}
          disabled={disabled}
        />
      )}

      {/* File Chosen Confirmation & Version Input */}
      {selectedFile && !uploading && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-base border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-mono font-bold text-content-primary">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-content-dim">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-xs text-content-muted hover:text-accent-rose transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Version name (e.g. 1.0.0)"
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Release notes / changelog..."
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartUpload}
            className="w-full mt-1"
          >
            Upload & Verify APK
          </Button>
        </div>
      )}

      {/* Live Upload Progress */}
      {uploading && (
        <UploadProgress
          progress={progress}
          loadedBytes={loadedBytes}
          totalBytes={totalBytes}
          fileName={selectedFile?.name}
          statusText={statusText}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default APKUploadCard;
