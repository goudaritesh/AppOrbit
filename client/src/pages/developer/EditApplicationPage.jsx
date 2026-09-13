import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  RotateCcw,
  Trash2,
  Check,
  Smartphone,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ApplicationStatusBadge from '../../components/developer/ApplicationStatusBadge';
import PageLoader from '../../components/common/PageLoader';
import NotFound from '../../components/common/NotFound';
import Modal from '../../components/ui/Modal';
import DragDropUploader from '../../components/common/DragDropUploader';
import ImagePreview from '../../components/common/ImagePreview';
import ScreenshotGrid from '../../components/common/ScreenshotGrid';
import VideoPreview from '../../components/common/VideoPreview';
import UploadProgress from '../../components/common/UploadProgress';
import APKUploadCard from '../../components/developer/APKUploadCard';
import {
  getDeveloperApp,
  updateApp,
  submitApp,
  archiveApp,
  restoreApp,
  deleteApp,
  uploadAppIcon,
  uploadAppScreenshots,
  uploadAppDemoVideo,
  deleteAppScreenshot,
} from '../../api/developerPortalApi';
import { getCategories } from '../../api/categoriesApi';

const PRESET_TECHS = [
  'Kotlin',
  'Jetpack Compose',
  'Flutter',
  'React Native',
  'TensorFlow Lite',
  'Firebase',
  'Room DB',
  'SQLite',
  'Coroutines',
  'Bluetooth BLE',
  'Node.js',
];

export const EditApplicationPage = () => {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    category: '',
    platform: 'ANDROID',
    tags: [],
    description: '',
    features: [],
    technologies: [],
    icon: '',
    screenshots: [],
    demoVideo: { url: '', type: 'youtube', provider: 'youtube' },
    githubUrl: '',
    demoUrl: '',
    externalApkUrl: '',
    status: 'DRAFT',
  });

  // Array inputs
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [customTechInput, setCustomTechInput] = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');

  // Sprint 3 Upload States
  const [iconUploading, setIconUploading] = useState(false);
  const [iconProgress, setIconProgress] = useState(0);
  const [shotsUploading, setShotsUploading] = useState(false);
  const [shotsProgress, setShotsProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [iconMode, setIconMode] = useState('upload'); // 'upload' | 'url'
  const [videoMode, setVideoMode] = useState('embed'); // 'upload' | 'embed'

  const handleIconUpload = async (file) => {
    if (!file) return;
    setIconUploading(true);
    setIconProgress(0);
    try {
      const res = await uploadAppIcon(appId, file, (pct) => setIconProgress(pct));
      updateField('icon', res.data?.icon);
      setFeedback({ type: 'success', message: 'App icon uploaded successfully' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to upload icon' });
    } finally {
      setIconUploading(false);
    }
  };

  const handleScreenshotsUpload = async (files) => {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : [files];
    setShotsUploading(true);
    setShotsProgress(0);
    try {
      const res = await uploadAppScreenshots(appId, fileArray, (pct) => setShotsProgress(pct));
      updateField('screenshots', res.data?.screenshots || []);
      setFeedback({ type: 'success', message: `${fileArray.length} screenshot(s) uploaded successfully` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to upload screenshots' });
    } finally {
      setShotsUploading(false);
    }
  };

  const handleScreenshotDelete = async (idx, shotId) => {
    try {
      const res = await deleteAppScreenshot(appId, shotId);
      updateField('screenshots', res.data?.screenshots || formData.screenshots.filter((_, i) => i !== idx));
      setFeedback({ type: 'success', message: 'Screenshot removed' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete screenshot' });
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const res = await uploadAppDemoVideo(appId, file, (pct) => setVideoProgress(pct));
      updateField('demoVideo', res.data?.demoVideo || { type: 'direct', url: res.data?.url, provider: 'direct' });
      setFeedback({ type: 'success', message: 'Demo video uploaded successfully' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to upload video' });
    } finally {
      setVideoUploading(false);
    }
  };

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    btnVariant: 'primary',
  });

  // Load app data & categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [appRes, catRes] = await Promise.all([
          getDeveloperApp(appId),
          getCategories(),
        ]);

        const app = appRes.data?.app;
        if (!app) {
          setNotFound(true);
          return;
        }

        document.title = `Edit ${app.name} — AppOrbit`;

        setFormData({
          name: app.name || '',
          shortDescription: app.shortDescription || '',
          category: app.category?._id || app.category || '',
          platform: app.platform || 'ANDROID',
          tags: app.tags || [],
          description: app.description || '',
          features: app.features || [],
          technologies: app.technologies || [],
          icon: app.icon || '',
          screenshots: app.screenshots || [],
          demoVideo: app.demoVideo || { url: '', type: 'youtube', provider: 'youtube' },
          githubUrl: app.githubUrl || '',
          demoUrl: app.demoUrl || '',
          externalApkUrl: app.externalApkUrl || '',
          status: app.status || 'DRAFT',
        });

        setCategories(catRes.data?.categories || []);
      } catch (err) {
        console.error('Failed to load application:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchData();
    }
  }, [appId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper additions
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput('');
    }
  };

  const removeTag = (t) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== t) }));
  };

  const addFeature = () => {
    const val = featureInput.trim();
    if (val && !formData.features.includes(val)) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, val] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => {
    setFormData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const toggleTech = (tech) => {
    setFormData((prev) => {
      const exists = prev.technologies.includes(tech);
      return {
        ...prev,
        technologies: exists
          ? prev.technologies.filter((t) => t !== tech)
          : [...prev.technologies, tech],
      };
    });
  };

  const addCustomTech = () => {
    const val = customTechInput.trim();
    if (val && !formData.technologies.includes(val)) {
      setFormData((prev) => ({ ...prev, technologies: [...prev.technologies, val] }));
      setCustomTechInput('');
    }
  };

  const addScreenshot = () => {
    const val = screenshotInput.trim();
    if (val && !formData.screenshots.some((s) => s.url === val)) {
      setFormData((prev) => ({
        ...prev,
        screenshots: [
          ...prev.screenshots,
          { url: val, alt: `${prev.name} Screenshot`, order: prev.screenshots.length + 1 },
        ],
      }));
      setScreenshotInput('');
    }
  };

  const removeScreenshot = (idx) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== idx),
    }));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateApp(appId, formData);
      setFeedback({ type: 'success', message: 'Application updated successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update application.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Review
  const handleSubmit = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateApp(appId, formData);
      await submitApp(appId);
      setFormData((prev) => ({ ...prev, status: 'PENDING_REVIEW' }));
      setFeedback({
        type: 'success',
        message: 'Application submitted for review successfully!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit application for review.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Archive
  const handleArchive = async () => {
    setIsSaving(true);
    try {
      await archiveApp(appId);
      setFormData((prev) => ({ ...prev, status: 'ARCHIVED' }));
      setFeedback({ type: 'success', message: 'Application moved to archive.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to archive application.',
      });
    } finally {
      setIsSaving(false);
      setConfirmModal({ isOpen: false });
    }
  };

  // Restore
  const handleRestore = async () => {
    setIsSaving(true);
    try {
      await restoreApp(appId);
      setFormData((prev) => ({ ...prev, status: 'DRAFT' }));
      setFeedback({ type: 'success', message: 'Application restored to draft status.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to restore application.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Draft
  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteApp(appId);
      navigate('/developer/apps');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete application draft.',
      });
      setIsSaving(false);
      setConfirmModal({ isOpen: false });
    }
  };

  if (loading) return <PageLoader message="Loading application..." />;
  if (notFound)
    return (
      <NotFound
        title="Application Not Found"
        message="This application does not exist or you do not have permission to edit it."
      />
    );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <Link
          to={`/developer/apps/${appId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-content-muted hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application Details</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary tracking-tight">
              Edit Application
            </h1>
            <ApplicationStatusBadge status={formData.status} />
          </div>

          <div className="flex items-center gap-2.5">
            <Link to={`/developer/apps/${appId}`}>
              <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                View
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'error'
              ? 'bg-accent-rose/10 border border-accent-rose/20 text-accent-rose'
              : 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Edit Form */}
      <div className="flex flex-col gap-6">
        {/* Section 1: Basic Information */}
        <Card padding="lg" className="flex flex-col gap-5 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-3 border-b border-white/5">
            Basic Information
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-primary">Application Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-content-primary">Short Description</label>
              <span className="text-[10px] font-mono text-content-dim">
                {formData.shortDescription.length} / 200
              </span>
            </div>
            <textarea
              rows={2}
              value={formData.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value.slice(0, 200))}
              className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Category</label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => updateField('platform', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ANDROID" className="bg-surface">
                  Android (APK)
                </option>
                <option value="WEB" className="bg-surface">
                  Web (PWA)
                </option>
                <option value="IOS" className="bg-surface">
                  iOS
                </option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-primary">Tags</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type tag and press Add"
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {formData.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-content-primary"
                  >
                    <span>#{t}</span>
                    <button onClick={() => removeTag(t)} className="hover:text-accent-rose">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Section 2: Full Description */}
        <Card padding="lg" className="flex flex-col gap-4 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-3 border-b border-white/5">
            Full Description
          </h2>
          <textarea
            rows={10}
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Write full formatted markdown description..."
            className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-white/10 text-xs text-content-primary font-mono focus:outline-none focus:border-primary resize-y"
          />
        </Card>

        {/* Section 3: Features & Technologies */}
        <Card padding="lg" className="flex flex-col gap-5 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-3 border-b border-white/5">
            Features & Technologies
          </h2>

          {/* Features */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-content-primary">Features</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="Add application capability..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
              <Button variant="outline" size="sm" onClick={addFeature}>
                Add
              </Button>
            </div>
            {formData.features.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {formData.features.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-elevated border border-white/5 text-xs text-content-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent-emerald" />
                      <span>{f}</span>
                    </span>
                    <button onClick={() => removeFeature(idx)} className="hover:text-accent-rose">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technologies */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-white/5">
            <label className="text-xs font-semibold text-content-primary">Technologies</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TECHS.map((tech) => {
                const selected = formData.technologies.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all ${
                      selected
                        ? 'bg-primary text-white border-primary font-bold'
                        : 'bg-surface-elevated text-content-secondary border-white/10 hover:border-white/20'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {tech}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                placeholder="Custom framework or library..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
              <Button variant="outline" size="sm" onClick={addCustomTech}>
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Section 4: Media & Visuals (Direct Computer Upload & URLs) */}
        <Card padding="lg" className="flex flex-col gap-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h2 className="text-base font-heading font-bold text-content-primary">
                Media Assets & Visuals
              </h2>
              <p className="text-xs text-content-muted">
                Upload branding icons, screenshots gallery, and demonstration videos directly from your computer.
              </p>
            </div>
          </div>

          {/* 1. App Icon Upload */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-content-primary">
                Application Icon (512x512 recommended)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIconMode('upload')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    iconMode === 'upload'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-surface-elevated text-content-muted border-white/10'
                  }`}
                >
                  Upload from PC
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode('url')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    iconMode === 'url'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-surface-elevated text-content-muted border-white/10'
                  }`}
                >
                  Enter Image URL
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <ImagePreview
                src={formData.icon}
                alt="App Icon"
                onRemove={formData.icon ? () => updateField('icon', '') : null}
              />

              <div className="flex-1 w-full">
                {iconMode === 'upload' ? (
                  <>
                    {iconUploading ? (
                      <UploadProgress
                        progress={iconProgress}
                        statusText="Uploading app icon..."
                      />
                    ) : (
                      <DragDropUploader
                        accept="image/png,image/jpeg,image/webp"
                        maxSizeMb={5}
                        title="Choose App Icon from Computer"
                        description="Drag & drop PNG, JPG, or WEBP (Max 5 MB)"
                        onFilesSelected={handleIconUpload}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.icon}
                      onChange={(e) => updateField('icon', e.target.value)}
                      placeholder="https://example.com/icon.png"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Screenshots Gallery */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <label className="text-xs font-semibold text-content-primary">
              Application Screenshots (Up to 10 images)
            </label>

            {shotsUploading ? (
              <UploadProgress
                progress={shotsProgress}
                statusText="Uploading screenshots to cloud storage..."
              />
            ) : (
              formData.screenshots.length < 10 && (
                <DragDropUploader
                  accept="image/png,image/jpeg,image/webp"
                  maxSizeMb={10}
                  multiple={true}
                  title="Upload Screenshots from Computer"
                  description="Select up to 10 screenshots (PNG, JPG, WEBP, max 10MB each)"
                  onFilesSelected={handleScreenshotsUpload}
                />
              )
            )}

            {formData.screenshots.length > 0 && (
              <ScreenshotGrid
                screenshots={formData.screenshots}
                onDelete={handleScreenshotDelete}
                onReorder={(reordered) => updateField('screenshots', reordered)}
              />
            )}

            {/* Fallback URL Add */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="url"
                value={screenshotInput}
                onChange={(e) => setScreenshotInput(e.target.value)}
                placeholder="Or paste an image URL: https://example.com/screenshot.jpg"
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
              <Button variant="outline" size="sm" onClick={addScreenshot}>
                Add URL
              </Button>
            </div>
          </div>

          {/* 3. Demo Video */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-content-primary">
                Demo Video
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoMode('embed')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    videoMode === 'embed'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-surface-elevated text-content-muted border-white/10'
                  }`}
                >
                  YouTube / Embed URL
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('upload')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    videoMode === 'upload'
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-surface-elevated text-content-muted border-white/10'
                  }`}
                >
                  Upload MP4 Video
                </button>
              </div>
            </div>

            {videoMode === 'upload' ? (
              <>
                {videoUploading ? (
                  <UploadProgress
                    progress={videoProgress}
                    statusText="Uploading video file..."
                  />
                ) : (
                  <DragDropUploader
                    accept="video/mp4,video/webm"
                    maxSizeMb={100}
                    title="Upload Demo Video from Computer"
                    description="MP4 or WEBM format (Max 100 MB)"
                    onFilesSelected={handleVideoUpload}
                  />
                )}
              </>
            ) : (
              <input
                type="url"
                value={formData.demoVideo?.url || ''}
                onChange={(e) =>
                  updateField('demoVideo', {
                    url: e.target.value,
                    type: 'youtube',
                    provider: 'youtube',
                  })
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            )}

            {formData.demoVideo?.url && (
              <VideoPreview
                video={formData.demoVideo}
                onRemove={() => updateField('demoVideo', { type: 'youtube', url: '', provider: 'youtube' })}
              />
            )}
          </div>

          {/* 4. External Code Repositories & Demo Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">GitHub Repository URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => updateField('githubUrl', e.target.value)}
                placeholder="https://github.com/organization/repo"
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Web Preview / Demo URL</label>
              <input
                type="url"
                value={formData.demoUrl}
                onChange={(e) => updateField('demoUrl', e.target.value)}
                placeholder="https://app-preview.example.com"
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>
            
            {/* Zero-Cost External Hosting */}
            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 pt-2 border-t border-white/5 mt-2">
              <label className="text-xs font-semibold text-content-primary flex items-center justify-between">
                <span>External APK Download URL <span className="text-primary">*</span></span>
                <span className="text-[10px] text-content-muted font-normal bg-primary/10 text-primary px-2 py-0.5 rounded">Zero-Cost MVP Architecture</span>
              </label>
              <input
                type="url"
                required
                value={formData.externalApkUrl}
                onChange={(e) => updateField('externalApkUrl', e.target.value)}
                placeholder="https://drive.google.com/file/d/... or https://github.com/releases/..."
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-content-secondary mt-1">
                Provide a direct download link to your APK hosted externally (e.g., GitHub Releases, Google Drive). This avoids platform bandwidth fees.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 4.5: Sprint 3 APK Upload & Binary Management */}
        <APKUploadCard
          appId={appId}
          currentApk={formData.currentVersion}
          onUploadSuccess={(apkData) => {
            setFormData((prev) => ({
              ...prev,
              currentVersion: apkData,
              version: apkData.version || apkData.versionName || prev.version,
              packageName: apkData.apkMetadata?.packageName || prev.packageName,
            }));
            setFeedback({
              type: 'success',
              message: 'APK binary successfully uploaded, validated, and linked to app!',
            });
          }}
        />

        {/* Section 5: State Actions & Danger Zone */}
        <Card padding="lg" className="flex flex-col gap-4 border border-white/10 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-2 border-b border-white/5">
            Application Status & Lifecycle Actions
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save All Changes
            </Button>

            {/* Submit for Review */}
            {(formData.status === 'DRAFT' || formData.status === 'REJECTED') && (
              <Button
                variant="outline"
                size="md"
                onClick={handleSubmit}
                loading={isSaving}
                icon={<Send className="w-4 h-4 text-primary" />}
              >
                Submit for Review
              </Button>
            )}

            {/* Archive */}
            {formData.status !== 'ARCHIVED' && formData.status !== 'PENDING_REVIEW' && (
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: `Archive ${formData.name}?`,
                    message:
                      'Archiving will remove this application from any public listings while preserving data.',
                    btnVariant: 'warning',
                    action: handleArchive,
                  })
                }
                icon={<Archive className="w-4 h-4 text-amber-400" />}
              >
                Archive Application
              </Button>
            )}

            {/* Restore */}
            {formData.status === 'ARCHIVED' && (
              <Button
                variant="outline"
                size="md"
                onClick={handleRestore}
                loading={isSaving}
                icon={<RotateCcw className="w-4 h-4 text-accent-cyan" />}
              >
                Restore to Draft
              </Button>
            )}

            {/* Delete Draft */}
            {formData.status === 'DRAFT' && (
              <Button
                variant="destructive"
                size="md"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: `Delete Draft ${formData.name}?`,
                    message:
                      'This draft application listing will be permanently deleted. This action cannot be undone.',
                    btnVariant: 'destructive',
                    action: handleDelete,
                  })
                }
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Draft
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        title={confirmModal.title}
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-content-secondary leading-relaxed">{confirmModal.message}</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal({ isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.btnVariant || 'primary'}
              size="sm"
              loading={isSaving}
              onClick={confirmModal.action}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditApplicationPage;
