import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DownloadCloud,
  Star,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  ExternalLink,
  Cpu,
  Layers,
  ArrowLeft,
  Calendar,
  HardDrive,
  Smartphone,
  Eye,
  Play,
  Share2,
  Lock,
  MessageSquare,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import NotFound from '../../components/common/NotFound';
import PageLoader from '../../components/common/PageLoader';
import AppCard from '../../components/apps/AppCard';
import ScreenshotModal from '../../components/apps/ScreenshotModal';
import DemoVideoModal from '../../components/apps/DemoVideoModal';
import DownloadModal from '../../components/downloads/DownloadModal';
import RatingSummary from '../../components/reviews/RatingSummary';
import RatingDistribution from '../../components/reviews/RatingDistribution';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList from '../../components/reviews/ReviewList';
import ReportReviewModal from '../../components/reviews/ReportReviewModal';
import DeveloperReplyModal from '../../components/reviews/DeveloperReplyModal';
import SEOHead from '../../components/common/SEOHead';
import { getAppBySlug, getRelatedApps } from '../../api/appsApi';
import reviewsApi from '../../api/reviewsApi';
import downloadsApi from '../../api/downloadsApi';
import analyticsApi from '../../api/analyticsApi';
import { formatDate, formatNumber } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AppDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);

  // State
  const [app, setApp] = useState(null);
  const [relatedApps, setRelatedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Download Session State
  const [downloadSessionData, setDownloadSessionData] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [reviewSort, setReviewSort] = useState('recent');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewEditing, setReviewEditing] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reportModalReview, setReportModalReview] = useState(null);
  const [developerReplyModalReview, setDeveloperReplyModalReview] = useState(null);

  // Modals
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Image fallback state
  const [iconError, setIconError] = useState(false);

  const fetchReviews = async (page = 1, sort = reviewSort, rating = reviewRatingFilter) => {
    if (!app?._id && !slug) return;
    try {
      const res = await reviewsApi.getAppReviews(app?._id || slug, {
        page,
        sort,
        rating: rating || undefined,
      });
      const data = res.data.data;
      setReviews(data.reviews || []);
      setReviewsPagination(data.pagination);
      setUserReview(data.userReview || null);

      if (data.ratingSummary) {
        setApp((prev) => ({
          ...prev,
          ratingAverage: data.ratingSummary.ratingAverage,
          ratingCount: data.ratingSummary.ratingCount,
          ratingDistribution: data.ratingSummary.ratingDistribution,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleInitiateDownload = async () => {
    try {
      const res = await downloadsApi.initiateDownload(app?._id || slug);
      setDownloadSessionData(res.data.data);
      setIsDownloadModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download is currently unavailable for this app');
    }
  };

  const handleReviewSubmit = async (formData) => {
    setReviewSubmitting(true);
    try {
      if (reviewEditing) {
        await reviewsApi.updateReview(reviewEditing._id, formData);
        toast.success('Review updated successfully');
      } else {
        await reviewsApi.createReview(app._id, formData);
        toast.success('Review submitted successfully');
      }
      setReviewFormOpen(false);
      setReviewEditing(null);
      await fetchReviews(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsApi.deleteReview(reviewId);
      toast.success('Review removed');
      await fetchReviews(reviewsPagination.page);
    } catch (err) {
      toast.error('Failed to remove review');
    }
  };

  const handleVoteHelpful = async (review) => {
    if (!currentUser) {
      toast.error('Please log in to vote');
      return;
    }
    try {
      if (review.hasVotedHelpful) {
        await reviewsApi.unvoteHelpful(review._id);
      } else {
        await reviewsApi.voteHelpful(review._id);
      }
      fetchReviews(reviewsPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    }
  };

  const handleReportReviewSubmit = async ({ reviewId, reason, description }) => {
    await reviewsApi.reportReview(reviewId, { reason, description });
  };

  const handleDeveloperReplySubmit = async ({ reviewId, message }) => {
    await reviewsApi.developerReply(reviewId, { message });
    fetchReviews(reviewsPagination.page);
  };

  useEffect(() => {
    const fetchAppDetails = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await getAppBySlug(slug);
        if (res.data?.app) {
          const appData = res.data.app;
          setApp(appData);

          // Track App View Analytics Event
          analyticsApi.trackEvent({
            eventType: 'APP_VIEW',
            appId: appData._id,
            developerId: appData.developer?._id || appData.developer,
            source: 'DIRECT',
          }).catch(() => {});

          // Fetch related applications
          try {
            const relRes = await getRelatedApps(slug);
            setRelatedApps(relRes.data?.apps || []);
          } catch (relErr) {
            console.warn('Could not load related apps:', relErr);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load app:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchAppDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (app?._id) {
      fetchReviews(1);
    }
  }, [app?._id]);

  if (loading) {
    return <PageLoader message="Loading application details..." />;
  }

  if (notFound || !app) {
    return <NotFound title="Application Not Found" message="The requested application does not exist or is currently private." />;
  }

  const categoryName = app.category?.name || 'General';
  const categorySlug = app.category?.slug || '';
  const developerName = app.developer?.name || 'Independent Developer';
  const isVerified = app.verificationStatus === 'VERIFIED' || app.developer?.verificationStatus === 'VERIFIED';
  const isAppDeveloper = Boolean(
    currentUser &&
      (currentUser.role === 'ADMIN' ||
        currentUser.role === 'SUPER_ADMIN' ||
        (app.developer &&
          (app.developer._id === currentUser._id ||
            app.developer.id === currentUser._id ||
            app.developer === currentUser._id)))
  );

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh]">
      <SEOHead
        title={app.name}
        description={app.shortDescription || app.description}
        canonicalUrl={`${window.location.origin}/apps/${app.slug || slug}`}
        ogImage={app.icon}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: app.name,
          operatingSystem: 'ANDROID',
          applicationCategory: categoryName,
          description: app.shortDescription || app.description,
          softwareVersion: app.currentVersion?.version || app.currentVersion?.versionName || '1.0.0',
          aggregateRating:
            app.ratingCount > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: app.ratingAverage || 5,
                  ratingCount: app.ratingCount || 1,
                }
              : undefined,
        }}
      />

      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono text-content-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-content-dim">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-white transition-colors">
            Apps
          </Link>
          <span>/</span>
          <span className="text-content-secondary truncate max-w-[150px]">{app.name}</span>
        </div>
      </div>

      {/* 1. HERO IDENTITY CARD */}
      <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 mb-10 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
          {/* App Identity Info */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-elevated border border-white/15 flex items-center justify-center text-5xl shadow-card flex-shrink-0 overflow-hidden">
              {app.icon && !iconError ? (
                <img
                  src={app.icon}
                  alt={app.name}
                  onError={() => setIconError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-heading font-extrabold text-primary text-4xl">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-content-primary">
                  {app.name}
                </h1>
                {isVerified && (
                  <Badge variant="published" dot>
                    Verified Signature
                  </Badge>
                )}
                {categorySlug && (
                  <Link to={`/explore?category=${categorySlug}`}>
                    <Badge variant="neutral" dot={false}>
                      {categoryName}
                    </Badge>
                  </Link>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-content-muted">
                  {app.platform || 'ANDROID'}
                </span>
              </div>

              {/* Developer Link */}
              <div className="flex items-center gap-2 text-sm text-content-secondary">
                <span>By</span>
                {app.developer?.id ? (
                  <Link
                    to={`/developers/${app.developer.id}`}
                    className="font-semibold text-content-primary hover:text-primary transition-colors underline decoration-white/20 underline-offset-4"
                  >
                    {developerName}
                  </Link>
                ) : (
                  <span className="font-semibold text-content-primary">{developerName}</span>
                )}
                {isVerified && (
                  <CheckCircle2
                    className="w-4 h-4 text-accent-cyan flex-shrink-0"
                    title="Verified Developer Profile"
                  />
                )}
              </div>

              {/* Short Description */}
              <p className="text-sm text-content-secondary max-w-2xl leading-relaxed">
                {app.shortDescription}
              </p>

              {/* Quick Metrics Strip */}
              <div className="flex flex-wrap items-center gap-6 mt-3 pt-3 border-t border-white/5 text-xs text-content-dim font-mono">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-content-primary text-sm">
                    {app.ratingAverage || 0}
                  </strong>
                  <span>({formatNumber(app.ratingCount || 0)} ratings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-accent-cyan" />
                  <strong className="text-content-primary text-sm">
                    {formatNumber(app.downloadCount || 0)}
                  </strong>
                  <span>Downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-accent-purple" />
                  <span>{formatNumber(app.viewCount || 0)} views</span>
                </div>
                {app.currentVersion?.version && (
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-content-muted" />
                    <span>v{app.currentVersion.version}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs Button Group */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-56 flex-shrink-0">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<DownloadCloud className="w-5 h-5" />}
              onClick={handleInitiateDownload}
            >
              Download APK
            </Button>

            {app.demoVideo?.url && (
              <Button
                variant="outline"
                size="md"
                className="w-full"
                icon={<Play className="w-4 h-4 text-accent-rose" />}
                onClick={() => setIsVideoModalOpen(true)}
              >
                Watch Demo
              </Button>
            )}

            {app.githubUrl && (
              <a
                href={app.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  icon={<GitBranch className="w-4 h-4" />}
                >
                  Source Code
                </Button>
              </a>
            )}

            {app.demoUrl && (
              <a
                href={app.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Web Preview
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY GRID (2 Columns: Content & Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT COLUMN: Gallery, Description, Features */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          {/* SCREENSHOTS GALLERY */}
          {app.screenshots && app.screenshots.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-heading font-bold text-content-primary">
                Application Screenshots
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                {app.screenshots.map((shot, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedScreenshotIndex(idx);
                      setIsScreenshotModalOpen(true);
                    }}
                    className="relative group rounded-2xl overflow-hidden border border-white/10 hover:border-primary flex-shrink-0 w-64 h-40 bg-surface-elevated transition-all shadow-card hover:scale-[1.02]"
                  >
                    <img
                      src={shot.url}
                      alt={shot.alt || `${app.name} screenshot ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                      Click to Enlarge
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FULL DESCRIPTION */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-heading font-bold text-content-primary">
              About this Application
            </h2>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-content-secondary whitespace-pre-line bg-surface border border-white/5 p-6 rounded-2xl">
              {app.description}
            </div>
          </div>

          {/* KEY FEATURES */}
          {app.features && app.features.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-heading font-bold text-content-primary">
                Core Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-white/5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-content-primary leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TECHNOLOGIES & TOOLCHAIN */}
          {app.technologies && app.technologies.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-heading font-bold text-content-primary">
                Technologies & Architecture
              </h2>
              <div className="flex flex-wrap gap-2">
                {app.technologies.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs font-mono text-content-primary"
                  >
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RATINGS & REVIEWS SECTION */}
          <div className="flex flex-col gap-6 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">
                  Ratings & Community Reviews
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified community feedback and ratings
                </p>
              </div>

              {!userReview && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!currentUser) {
                      toast.error('Please log in to submit a review');
                      navigate('/login');
                      return;
                    }
                    setReviewFormOpen(true);
                    setReviewEditing(null);
                  }}
                >
                  Write a Review
                </Button>
              )}
            </div>

            {/* Rating Summary & Star Distribution Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
              <div className="sm:col-span-1">
                <RatingSummary
                  averageRating={app.ratingAverage || 0}
                  ratingCount={app.ratingCount || 0}
                />
              </div>
              <div className="sm:col-span-2">
                <RatingDistribution
                  distribution={app.ratingDistribution || {}}
                  totalRatings={app.ratingCount || 0}
                />
              </div>
            </div>

            {/* User Review Form (Create or Edit) */}
            {reviewFormOpen && (
              <ReviewForm
                initialData={reviewEditing}
                isEdit={!!reviewEditing}
                submitting={reviewSubmitting}
                onSubmit={handleReviewSubmit}
                onCancel={() => {
                  setReviewFormOpen(false);
                  setReviewEditing(null);
                }}
              />
            )}

            {/* Review List */}
            <ReviewList
              reviews={reviews}
              pagination={reviewsPagination}
              onPageChange={(p) => fetchReviews(p, reviewSort, reviewRatingFilter)}
              onSortChange={(s) => {
                setReviewSort(s);
                fetchReviews(1, s, reviewRatingFilter);
              }}
              onRatingFilterChange={(r) => {
                setReviewRatingFilter(r);
                fetchReviews(1, reviewSort, r);
              }}
              currentSort={reviewSort}
              currentRatingFilter={reviewRatingFilter}
              onVoteHelpful={handleVoteHelpful}
              onReport={(rev) => setReportModalReview(rev)}
              onEdit={(rev) => {
                setReviewEditing(rev);
                setReviewFormOpen(true);
              }}
              onDelete={handleDeleteReview}
              onReply={(rev) => setDeveloperReplyModalReview(rev)}
              isDeveloper={isAppDeveloper}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Technical Specs & Developer Info */}
        <div className="flex flex-col gap-8">
          {/* TECHNICAL SPECIFICATIONS CARD */}
          <div className="p-6 rounded-2xl bg-surface border border-white/10 flex flex-col gap-4 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-content-primary pb-3 border-b border-white/5">
              Technical Specifications
            </h3>

            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-content-muted">Current Version</span>
                <span className="text-content-primary font-bold">
                  {app.currentVersion?.version || '1.0.0'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Version Code</span>
                <span className="text-content-primary font-bold">
                  {app.currentVersion?.versionCode || 1}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Package Size</span>
                <span className="text-content-primary">
                  {app.currentVersion?.fileSize || '15.0 MB'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Minimum OS</span>
                <span className="text-content-primary">
                  {app.currentVersion?.minAndroid || 'Android 8.0+'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Published On</span>
                <span className="text-content-primary">
                  {formatDate(app.publishedAt || app.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Last Updated</span>
                <span className="text-content-primary">{formatDate(app.updatedAt)}</span>
              </div>
            </div>

            {/* Release Notes */}
            {app.currentVersion?.releaseNotes && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[11px] font-mono text-content-muted uppercase tracking-wider block mb-1">
                  What's New in v{app.currentVersion.version}
                </span>
                <p className="text-xs text-content-secondary leading-relaxed bg-surface-elevated p-3 rounded-xl border border-white/5">
                  {app.currentVersion.releaseNotes}
                </p>
              </div>
            )}
          </div>

          {/* DEVELOPER CARD */}
          <div className="p-6 rounded-2xl bg-surface border border-white/10 flex flex-col gap-4 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-content-primary pb-3 border-b border-white/5">
              About the Developer
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {app.developer?.profileImage ? (
                  <img
                    src={app.developer.profileImage}
                    alt={developerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-heading font-bold text-accent-cyan text-lg">
                    {developerName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-heading font-bold text-sm text-content-primary truncate">
                    {developerName}
                  </span>
                  {isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-content-muted">
                  {isVerified ? 'Verified Organization' : 'Community Developer'}
                </span>
              </div>
            </div>

            {app.developer?.bio && (
              <p className="text-xs text-content-secondary leading-relaxed line-clamp-3">
                {app.developer.bio}
              </p>
            )}

            {app.developer?.id && (
              <Link to={`/developers/${app.developer.id}`} className="mt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Developer Profile
                </Button>
              </Link>
            )}
          </div>

          {/* TRUST & INTEGRITY BADGE */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-heading font-bold text-content-primary">
                Signature Security & Trust
              </span>
              <p className="text-content-secondary leading-relaxed">
                This package metadata was submitted with signed cryptographic keys. APK binaries
                and malware telemetry pipelines will be unlocked in upcoming platform releases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RELATED APPLICATIONS */}
      {relatedApps.length > 0 && (
        <div className="mt-16 pt-12 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold font-heading text-content-primary">
                Related in {categoryName}
              </h2>
              <p className="text-xs text-content-muted mt-1">
                More applications you might find helpful.
              </p>
            </div>
            <Link to={`/explore?category=${categorySlug}`}>
              <Button variant="ghost" size="sm">
                Explore Category
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedApps.map((relApp) => (
              <AppCard key={relApp.id} app={relApp} />
            ))}
          </div>
        </div>
      )}

      {/* 4. MODALS */}
      {/* Screenshot Lightbox */}
      <ScreenshotModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        screenshots={app.screenshots}
        currentIndex={selectedScreenshotIndex}
        setCurrentIndex={setSelectedScreenshotIndex}
      />

      {/* Demo Video Modal */}
      <DemoVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        demoVideo={app.demoVideo}
        appName={app.name}
      />

      {/* Phase 9 Secure Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        sessionData={downloadSessionData}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownloadComplete={(token) => {
          downloadsApi.completeDownload(token).catch(() => {});
        }}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={!!reportModalReview}
        review={reportModalReview}
        onClose={() => setReportModalReview(null)}
        onSubmit={handleReportReviewSubmit}
      />

      {/* Developer Reply Modal */}
      <DeveloperReplyModal
        isOpen={!!developerReplyModalReview}
        review={developerReplyModalReview}
        onClose={() => setDeveloperReplyModalReview(null)}
        onSubmit={handleDeveloperReplySubmit}
      />
    </div>
  );
};

export default AppDetailsPage;
