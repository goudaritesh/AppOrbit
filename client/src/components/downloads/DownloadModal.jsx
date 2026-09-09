import React, { useState } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  Copy,
  Check,
  FileCode,
  HardDrive,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DownloadModal = ({ isOpen, sessionData, onClose, onDownloadComplete }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !sessionData) return null;

  const { application, version, downloadUrl, sessionToken } = sessionData;

  const handleCopyHash = () => {
    if (version?.sha256) {
      navigator.clipboard.writeText(version.sha256);
      setCopied(true);
      toast.success('SHA-256 Hash copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartDownload = () => {
    setDownloading(true);

    // Open download link in browser
    const fullDownloadUrl = downloadUrl.startsWith('http')
      ? downloadUrl
      : `${window.location.origin}${downloadUrl}`;

    // Create hidden anchor to trigger download
    const link = document.createElement('a');
    link.href = fullDownloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Starting secure download...');
    if (onDownloadComplete) {
      onDownloadComplete(sessionToken);
    }

    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shadow-inner">
              {application?.icon ? (
                <img
                  src={application.icon}
                  alt={application.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <FileCode className="w-7 h-7 text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg sm:text-xl tracking-tight">
                {application?.name || 'Application Download'}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-slate-400">
                  Version {version?.versionName || '1.0.0'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-indigo-400" />
                  <span>{application?.developer?.name || 'Developer'}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Verification Banner */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Passed AppOrbit Security Checks</span>
          </div>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            This APK has been analyzed for malware, signature validity, and dangerous permissions.
            Always verify the publisher and application details before installing software.
          </p>
        </div>

        {/* File & Integrity Details */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Package Size</span>
            </span>
            <span className="font-semibold text-slate-200">{version?.fileSize || 'Standard'}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">SHA-256 Checksum</span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 break-all select-all">
              {version?.sha256 || 'Awaiting integrity computation'}
            </div>
          </div>
        </div>

        {/* Download Action */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleStartDownload}
            disabled={downloading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:via-teal-600 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2.5 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Preparing APK...' : 'Download APK Now'}</span>
          </button>
          <div className="text-center text-[11px] text-slate-500">
            Secure temporary download session valid for 20 minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
