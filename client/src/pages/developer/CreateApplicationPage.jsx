import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Save,
  Send,
  AlertCircle,
  Smartphone,
  ExternalLink,
  GitBranch,
  Play,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DragDropUploader from '../../components/common/DragDropUploader';
import ImagePreview from '../../components/common/ImagePreview';
import ScreenshotGrid from '../../components/common/ScreenshotGrid';
import VideoPreview from '../../components/common/VideoPreview';
import { createApp, submitApp } from '../../api/developerPortalApi';
import { getCategories } from '../../api/categoriesApi';

const STEPS = [
  { id: 1, title: 'Basic Info', desc: 'Name, category & platform' },
  { id: 2, title: 'Details', desc: 'Application description' },
  { id: 3, title: 'Features & Tech', desc: 'Capabilities & toolchain' },
  { id: 4, title: 'Media & Links', desc: 'Icons, shots & repos' },
  { id: 5, title: 'Review', desc: 'Inspect & save draft' },
];

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

export const CreateApplicationPage = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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
  });

  // Intermediate input states for arrays
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [customTechInput, setCustomTechInput] = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');

  // UI status
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewTab, setPreviewTab] = useState('write'); // 'write' | 'preview'

  // 1. Fetch categories on mount
  useEffect(() => {
    document.title = 'Create Application — AppOrbit Developer Portal';
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        const cats = res.data?.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: cats[0].id }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Update field handler
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Tag helper
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val) && formData.tags.length < 15) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Feature helper
  const addFeature = () => {
    const val = featureInput.trim();
    if (val && !formData.features.includes(val) && formData.features.length < 20) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, val] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  // Tech helper
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

  // Screenshot helper
  const addScreenshot = () => {
    const val = screenshotInput.trim();
    if (val && !formData.screenshots.some((s) => s.url === val)) {
      setFormData((prev) => ({
        ...prev,
        screenshots: [
          ...prev.screenshots,
          { url: val, alt: `${prev.name || 'App'} Screenshot`, order: prev.screenshots.length + 1 },
        ],
      }));
      setScreenshotInput('');
    }
  };

  const removeScreenshot = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  // Sprint 3 Local File Selection Handlers
  const [iconMode, setIconMode] = useState('upload'); // 'upload' | 'url'
  const [videoMode, setVideoMode] = useState('embed'); // 'upload' | 'embed'

  const handleLocalIconFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField('icon', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLocalScreenshotFiles = (files) => {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : [files];
    const available = 10 - formData.screenshots.length;
    const toProcess = fileArray.slice(0, available);

    toProcess.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => {
          if (prev.screenshots.length >= 10) return prev;
          return {
            ...prev,
            screenshots: [
              ...prev.screenshots,
              { url: e.target.result, alt: f.name, order: prev.screenshots.length + 1 },
            ],
          };
        });
      };
      reader.readAsDataURL(f);
    });
  };

  const handleLocalVideoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField('demoVideo', {
        type: 'direct',
        url: e.target.result,
        provider: 'direct',
      });
    };
    reader.readAsDataURL(file);
  };

  // Validation per step
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        newErrors.name = 'Application name must be at least 2 characters';
      }
      if (!formData.shortDescription.trim() || formData.shortDescription.trim().length < 5) {
        newErrors.shortDescription = 'Short description must be at least 5 characters';
      }
      if (!formData.category) {
        newErrors.category = 'Please select a valid category';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createApp(formData);
      navigate(`/developer/apps/${res.data?.app?._id || ''}`);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to save application draft.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the application
      const createRes = await createApp(formData);
      const newAppId = createRes.data?.app?._id;

      // 2. Submit for review
      await submitApp(newAppId);
      navigate(`/developer/apps/${newAppId}`);
    } catch (err) {
      console.error('Failed to submit application:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to submit application for review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === formData.category);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-2">
        <Link
          to="/developer/apps"
          className="inline-flex items-center gap-2 text-xs font-mono text-content-muted hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Applications</span>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary tracking-tight">
            Create Application Listing
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            loading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
        </div>
      </div>

      {/* Global Submit Error Banner */}
      {errors.submit && (
        <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* 2. PROGRESS STEPPER */}
      <div className="grid grid-cols-5 gap-2 border-b border-white/10 pb-4">
        {STEPS.map((s) => {
          const isComplete = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                if (s.id < currentStep || validateStep(currentStep)) {
                  setCurrentStep(s.id);
                }
              }}
              className="flex flex-col text-left gap-1 transition-opacity text-xs"
            >
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isComplete
                    ? 'bg-accent-emerald'
                    : isCurrent
                    ? 'bg-primary'
                    : 'bg-surface-elevated'
                }`}
              />
              <span
                className={`font-mono text-[11px] truncate ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isComplete
                    ? 'text-accent-emerald'
                    : 'text-content-dim'
                }`}
              >
                Step {s.id}
              </span>
              <span className="font-heading font-semibold text-content-secondary hidden sm:inline truncate">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. STEP CONTENT PANELS */}
      <Card padding="lg" className="flex flex-col gap-6 shadow-glass">
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold font-heading text-content-primary">
                Basic Application Information
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Define the primary identification attributes for your Android package.
              </p>
            </div>

            {/* App Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">
                Application Name <span className="text-accent-rose">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. PulseGuard, SmartWater"
                className={`px-3.5 py-2.5 rounded-xl bg-surface-elevated border text-xs text-content-primary placeholder:text-content-muted focus:outline-none ${
                  errors.name ? 'border-accent-rose' : 'border-white/10 focus:border-primary'
                }`}
              />
              {errors.name && <span className="text-[11px] text-accent-rose">{errors.name}</span>}
            </div>

            {/* Short Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-content-primary">
                  Short Description <span className="text-accent-rose">*</span>
                </label>
                <span className="text-[10px] font-mono text-content-dim">
                  {formData.shortDescription.length} / 200
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value.slice(0, 200))}
                placeholder="A concise summary of what your application does (displayed on cards)."
                className={`px-3.5 py-2.5 rounded-xl bg-surface-elevated border text-xs text-content-primary placeholder:text-content-muted focus:outline-none resize-none ${
                  errors.shortDescription
                    ? 'border-accent-rose'
                    : 'border-white/10 focus:border-primary'
                }`}
              />
              {errors.shortDescription && (
                <span className="text-[11px] text-accent-rose">{errors.shortDescription}</span>
              )}
            </div>

            {/* Category & Platform Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-content-primary">
                  Category <span className="text-accent-rose">*</span>
                </label>
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

              {/* Platform */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-content-primary">Target Platform</label>
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
              <label className="text-xs font-semibold text-content-primary">Tags & Keywords</label>
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
                  placeholder="Type tag and press Add (e.g. Health, BLE, IoT)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-content-primary"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-accent-rose transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: APPLICATION DETAILS (FULL DESCRIPTION) */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold font-heading text-content-primary">
                Application Details & Description
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Provide comprehensive documentation of features, architecture, and user guidelines.
              </p>
            </div>

            {/* Tabs for Write & Preview */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('write')}
                  className={`text-xs font-mono px-3 py-1 rounded-lg transition-colors ${
                    previewTab === 'write'
                      ? 'bg-primary text-white font-bold'
                      : 'text-content-muted hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`text-xs font-mono px-3 py-1 rounded-lg transition-colors ${
                    previewTab === 'preview'
                      ? 'bg-primary text-white font-bold'
                      : 'text-content-muted hover:text-white'
                  }`}
                >
                  Markdown Preview
                </button>
              </div>
              <span className="text-[11px] font-mono text-content-dim">
                {formData.description.length} characters
              </span>
            </div>

            {previewTab === 'write' ? (
              <textarea
                rows={12}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Write formatted markdown application details here...&#10;&#10;### Overview&#10;Describe your application...&#10;&#10;### How It Works&#10;Explain setup and requirements..."
                className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-white/10 text-xs text-content-primary font-mono focus:outline-none focus:border-primary resize-y"
              />
            ) : (
              <div className="min-h-[280px] p-4 rounded-2xl bg-surface-elevated border border-white/10 text-xs text-content-secondary whitespace-pre-line leading-relaxed">
                {formData.description || (
                  <span className="text-content-dim italic">
                    No description content entered yet. Switch back to Editor to write.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: FEATURES & TECHNOLOGIES */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-heading text-content-primary">
                Features & Technology Stack
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Highlight key functionalities and the software toolchain used.
              </p>
            </div>

            {/* Feature Bullet Points */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-content-primary">Key Features</label>
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
                  placeholder="e.g. Offline PPG cardiac analysis, Real-time SMS alerts..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
                <Button variant="outline" size="sm" onClick={addFeature}>
                  Add Feature
                </Button>
              </div>

              {formData.features.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {formData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-elevated border border-white/5 text-xs text-content-primary"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-accent-emerald" />
                        <span>{feat}</span>
                      </span>
                      <button
                        onClick={() => removeFeature(idx)}
                        className="text-content-dim hover:text-accent-rose transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Technologies */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <label className="text-xs font-semibold text-content-primary">
                Technologies & Frameworks
              </label>

              {/* Preset Chips */}
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
                          ? 'bg-primary text-white border-primary font-bold shadow-sm'
                          : 'bg-surface-elevated text-content-secondary border-white/10 hover:border-white/20'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {tech}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tech Addition */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={customTechInput}
                  onChange={(e) => setCustomTechInput(e.target.value)}
                  placeholder="Other framework, library or SDK..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
                <Button variant="outline" size="sm" onClick={addCustomTech}>
                  Add Custom Tech
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MEDIA & LINKS */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-heading text-content-primary">
                Media Assets & External Links
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Upload branding icons, screenshots gallery, and demonstration videos directly from your computer.
              </p>
            </div>

            {/* 1. App Icon */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-content-primary">
                  App Icon (PNG, JPG, WEBP • Max 5 MB)
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
                    Paste URL
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <ImagePreview
                  src={formData.icon}
                  alt="App Icon Preview"
                  onRemove={formData.icon ? () => updateField('icon', '') : null}
                />

                <div className="flex-1 w-full">
                  {iconMode === 'upload' ? (
                    <DragDropUploader
                      accept="image/png,image/jpeg,image/webp"
                      maxSizeMb={5}
                      title="Choose App Icon from Computer"
                      description="Drag & drop PNG, JPG, or WEBP (Max 5 MB)"
                      onFilesSelected={handleLocalIconFile}
                    />
                  ) : (
                    <input
                      type="url"
                      value={formData.icon}
                      onChange={(e) => updateField('icon', e.target.value)}
                      placeholder="https://example.com/icon.png"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 2. Screenshots */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <label className="text-xs font-semibold text-content-primary">
                Application Screenshots (Up to 10 images)
              </label>

              {formData.screenshots.length < 10 && (
                <DragDropUploader
                  accept="image/png,image/jpeg,image/webp"
                  maxSizeMb={10}
                  multiple={true}
                  title="Upload Screenshots from Computer"
                  description="Select up to 10 screenshots (PNG, JPG, WEBP, max 10MB each)"
                  onFilesSelected={handleLocalScreenshotFiles}
                />
              )}

              {formData.screenshots.length > 0 && (
                <ScreenshotGrid
                  screenshots={formData.screenshots}
                  onDelete={removeScreenshot}
                  onReorder={(reordered) => updateField('screenshots', reordered)}
                />
              )}

              {/* Fallback URL Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  value={screenshotInput}
                  onChange={(e) => setScreenshotInput(e.target.value)}
                  placeholder="Or paste screenshot URL: https://example.com/screenshot.jpg"
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
                    YouTube Embed URL
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
                    Upload Video File
                  </button>
                </div>
              </div>

              {videoMode === 'upload' ? (
                <DragDropUploader
                  accept="video/mp4,video/webm"
                  maxSizeMb={100}
                  title="Upload Demo Video from Computer"
                  description="MP4 or WEBM format (Max 100 MB)"
                  onFilesSelected={handleLocalVideoFile}
                />
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

            {/* 4. GitHub & Web Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-content-primary">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  placeholder="https://github.com/organization/repo"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-content-primary">
                  Web Preview / Demo URL
                </label>
                <input
                  type="url"
                  value={formData.demoUrl}
                  onChange={(e) => updateField('demoUrl', e.target.value)}
                  placeholder="https://app-preview.example.com"
                  className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUMMARY */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-heading text-content-primary">
                Review Application Details
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Verify application metadata before saving or submitting for review.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-white/10 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-white/15 flex items-center justify-center text-xl font-bold text-primary overflow-hidden flex-shrink-0">
                  {formData.icon ? (
                    <img src={formData.icon} alt="" className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0) || 'A'
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-lg text-content-primary">
                      {formData.name || 'Untitled Application'}
                    </h3>
                    <Badge variant="neutral" size="sm">
                      {selectedCategoryObj?.name || 'Category'}
                    </Badge>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-content-muted">
                      {formData.platform}
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary">{formData.shortDescription}</p>
                </div>
              </div>

              {/* Technologies */}
              {formData.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                  {formData.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface text-content-muted border border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Features Summary */}
              {formData.features.length > 0 && (
                <div className="flex flex-col gap-1 pt-3 border-t border-white/5 text-xs text-content-secondary">
                  <span className="font-semibold text-content-primary mb-1">Key Features:</span>
                  {formData.features.map((f, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald flex-shrink-0" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Architecture Notice */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-content-secondary leading-relaxed">
              <strong className="text-content-primary block mb-1 font-heading">
                Release Pipeline Status:
              </strong>
              Submitting for review prepares your application metadata. APK file uploads and
              malware verification pipelines will be connected in Phase 5 and Phase 6 before public
              marketplace exposure.
            </div>
          </div>
        )}

        {/* STEPPER NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              loading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              Save as Draft
            </Button>

            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitForReview}
                loading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                Submit for Review
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateApplicationPage;
