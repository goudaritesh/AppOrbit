import React, { useState, useEffect } from 'react';
import {
  Layers,
  Flame,
  Search,
  Filter,
  Plus,
  Star,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  getHubApps,
  publishHubApp,
  subscribeToHubApps,
  submitHubReview,
  getHubAppReviews,
} from '../../services/firestoreHubService';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Productivity', 'Tools', 'Security', 'Entertainment', 'Finance', 'Utilities'];

export default function ApplicationHubPage() {
  const { user, isAuthenticated, login, register, logout } = useFirebaseAuth();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appReviews, setAppReviews] = useState([]);

  // Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [newApp, setNewApp] = useState({
    title: '',
    category: 'Productivity',
    description: '',
    version: '1.0.0',
    iconUrl: '',
    downloadUrl: '',
    apkSize: '12 MB',
  });
  const [publishSubmitting, setPublishSubmitting] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Real-time Firestore apps subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToHubApps((fetchedApps) => {
      setApps(fetchedApps);
      setLoading(false);
    }, selectedCategory === 'All' ? null : selectedCategory);

    return () => unsubscribe && unsubscribe();
  }, [selectedCategory]);

  // Load reviews when an app is selected
  useEffect(() => {
    if (selectedApp) {
      getHubAppReviews(selectedApp.id).then(setAppReviews).catch(console.error);
    }
  }, [selectedApp]);

  // Filter apps by search
  const filteredApps = apps.filter((app) => {
    const matchSearch =
      (app.title || app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error('Please provide both email and password');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (isRegisterMode) {
        await register(authEmail, authPassword, { name: authName });
      } else {
        await login(authEmail, authPassword);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err) {
      // Error handled by context toast
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!newApp.title) {
      toast.error('Application title is required');
      return;
    }
    setPublishSubmitting(true);
    try {
      await publishHubApp(newApp, user);
      toast.success('App published successfully to Firestore!');
      setShowPublishModal(false);
      setNewApp({
        title: '',
        category: 'Productivity',
        description: '',
        version: '1.0.0',
        iconUrl: '',
        downloadUrl: '',
        apkSize: '12 MB',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to publish app');
    } finally {
      setPublishSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setReviewSubmitting(true);
    try {
      await submitHubReview(selectedApp.id, { rating: reviewRating, comment: reviewComment }, user);
      toast.success('Review submitted to Firestore!');
      setReviewComment('');
      // Reload reviews
      const updated = await getHubAppReviews(selectedApp.id);
      setAppReviews(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner: Firebase Backend Badge */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Firebase Application Hub</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Live: apporbit-e635d
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Backed by Google Firebase Authentication & Cloud Firestore (Standard Edition • Mumbai asia-south1)
              </p>
            </div>
          </div>

          {/* Auth State Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{user.name || user.email}</div>
                  <div className="text-xs text-slate-400">Firebase User</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition flex items-center gap-2 border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Firebase Sign In
              </button>
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                } else {
                  setShowPublishModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Publish to Hub
            </button>
          </div>
        </div>
      </div>

      {/* Main Hub Content */}
      <div className="max-w-7xl mx-auto">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search apps in Hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-200 placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse h-56" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Applications in this Category Yet</h3>
            <p className="text-slate-400 text-sm mb-6">
              Be the first to publish an application to Cloud Firestore in the Application Hub!
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                } else {
                  setShowPublishModal(true);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Publish First App
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80'}
                      alt={app.title || app.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-800 border border-slate-700/60 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white truncate text-base group-hover:text-blue-400 transition">
                          {app.title || app.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {app.category || 'App'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">by {app.developerName || 'Developer'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {app.rating || 5.0}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>{app.apkSize || '15 MB'}</span>
                        <span className="text-slate-500">•</span>
                        <span>v{app.version || '1.0.0'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {app.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Firestore Verified
                  </span>
                  <button className="text-blue-400 group-hover:text-blue-300 font-semibold flex items-center gap-1">
                    Details & Reviews
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* App Details & Reviews Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-5 mb-6">
              <img
                src={selectedApp.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80'}
                alt={selectedApp.title}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-700/60"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-white">{selectedApp.title || selectedApp.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedApp.category}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">Published by {selectedApp.developerName}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {selectedApp.rating || 5.0} ({selectedApp.ratingCount || 1} ratings)
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>Version {selectedApp.version || '1.0.0'}</span>
                  <span className="text-slate-600">|</span>
                  <span>{selectedApp.apkSize || '15 MB'}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Description</h4>
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                {selectedApp.description}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Community Reviews ({appReviews.length})
                </h4>
              </div>

              {/* Review Input */}
              <form onSubmit={handleReviewSubmit} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-400 font-medium">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-4 h-4 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isAuthenticated ? 'Write a review in Firestore...' : 'Sign in to write a review'}
                    disabled={!isAuthenticated || reviewSubmitting}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!isAuthenticated || reviewSubmitting || !reviewComment.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                  >
                    {reviewSubmitting ? 'Posting...' : 'Submit'}
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {appReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No reviews yet. Be the first to leave one!</p>
                ) : (
                  appReviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300">{rev.userName || 'Anonymous'}</span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {rev.rating}
                        </span>
                      </div>
                      <p className="text-slate-400">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                Close
              </button>
              {selectedApp.downloadUrl ? (
                <a
                  href={selectedApp.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  Download Application
                </a>
              ) : (
                <button
                  onClick={() => toast.success('Application package download simulated.')}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish App Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPublishModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Publish to Cloud Firestore</h3>
                <p className="text-xs text-slate-400">Add an application to the AppOrbit Application Hub</p>
              </div>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PulseGuard VPN"
                  value={newApp.title}
                  onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newApp.category}
                    onChange={(e) => setNewApp({ ...newApp, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Version</label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={newApp.version}
                    onChange={(e) => setNewApp({ ...newApp, version: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Comprehensive description of application capabilities..."
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Icon URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newApp.iconUrl}
                    onChange={(e) => setNewApp({ ...newApp, iconUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Package Size</label>
                  <input
                    type="text"
                    placeholder="15 MB"
                    value={newApp.apkSize}
                    onChange={(e) => setNewApp({ ...newApp, apkSize: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center gap-2"
                >
                  {publishSubmitting ? 'Saving to Firestore...' : 'Publish to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firebase Authentication Modal (Email/Password) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isRegisterMode ? 'Create Firebase Account' : 'Firebase Sign In'}
                </h3>
                <p className="text-xs text-slate-400">Email & Password Authentication</p>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="developer@apporbit.io"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition mt-2"
              >
                {authSubmitting
                  ? 'Authenticating...'
                  : isRegisterMode
                  ? 'Register with Firebase'
                  : 'Sign In with Firebase'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  {isRegisterMode
                    ? 'Already have an account? Sign In'
                    : "Don't have an account yet? Create one"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
