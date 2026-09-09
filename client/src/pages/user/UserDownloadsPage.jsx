import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, HardDrive, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import downloadsApi from '../../api/downloadsApi';
import DownloadModal from '../../components/downloads/DownloadModal';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const UserDownloadsPage = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await downloadsApi.getUserDownloads();
      setDownloads(res.data.data.history || []);
    } catch (err) {
      toast.error('Failed to load your download history');
    } finally {
      setLoading(false);
    }
  };

  const handleReDownload = async (appId, versionId) => {
    try {
      const res = await downloadsApi.initiateDownload(appId, { versionId });
      setActiveSession(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download preparation failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <SEOHead title="My Downloads" description="View and manage your downloaded applications on AppOrbit" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Download History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Applications and APK packages downloaded to your account
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <span>Explore Apps</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : downloads.length > 0 ? (
        <div className="space-y-3">
          {downloads.map((item) => {
            const app = item.application;
            const version = item.version;
            const downloadDate = new Date(item.downloadedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={item.eventId}
                className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                    {app?.icon ? (
                      <img
                        src={app.icon}
                        alt={app.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Download className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/apps/${app?.slug || app?._id}`}
                      className="font-bold text-white text-base hover:text-indigo-400 transition-colors"
                    >
                      {app?.name || 'Application'}
                    </Link>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span>Version {version?.versionName || '1.0.0'}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{version?.fileSize || 'Standard'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{downloadDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleReDownload(app?._id, version?._id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Again</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3 shadow-inner">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No downloads yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't downloaded any APK files yet. Discover verified, safe applications from our community!
          </p>
          <div className="mt-5">
            <Link
              to="/explore"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 inline-flex items-center space-x-1.5"
            >
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      )}

      {/* Re-download Modal */}
      <DownloadModal
        isOpen={!!activeSession}
        sessionData={activeSession}
        onClose={() => setActiveSession(null)}
      />
    </div>
  );
};

export default UserDownloadsPage;
