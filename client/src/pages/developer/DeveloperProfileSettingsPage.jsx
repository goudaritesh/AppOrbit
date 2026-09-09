import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User,
  Building,
  Globe,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  Save,
  Check,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoader from '../../components/common/PageLoader';
import { developerApi } from '../../api/developerApi';
import { authApi } from '../../api/authApi';
import { updateUser } from '../../store/slices/authSlice';

export const DeveloperProfileSettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    profileImage: user?.profileImage || '',
    companyName: '',
    website: '',
    githubProfile: '',
    portfolioUrl: '',
    developerBio: '',
    verificationStatus: 'UNVERIFIED',
  });

  useEffect(() => {
    document.title = 'Developer Profile — AppOrbit';
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await developerApi.getProfile();
        const profile = res.data?.profile;
        if (profile) {
          setFormData({
            name: user?.name || '',
            profileImage: user?.profileImage || '',
            companyName: profile.companyName || '',
            website: profile.website || '',
            githubProfile: profile.githubProfile || '',
            portfolioUrl: profile.portfolioUrl || '',
            developerBio: profile.developerBio || '',
            verificationStatus: profile.verificationStatus || 'UNVERIFIED',
          });
        }
      } catch (err) {
        console.error('Failed to load developer profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      // 1. Update developer profile specific fields
      await developerApi.updateProfile({
        companyName: formData.companyName,
        website: formData.website,
        githubProfile: formData.githubProfile,
        portfolioUrl: formData.portfolioUrl,
        developerBio: formData.developerBio,
      });

      // 2. Update user name / avatar if changed
      if (formData.name !== user?.name || formData.profileImage !== user?.profileImage) {
        const userRes = await authApi.updateProfile({
          name: formData.name,
          profileImage: formData.profileImage,
        });
        if (userRes?.data?.user) {
          dispatch(updateUser(userRes.data.user));
        }
      }

      setFeedback({ type: 'success', message: 'Developer profile updated successfully!' });
    } catch (err) {
      console.error('Failed to update developer profile:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update developer profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Loading developer profile..." />;

  const isVerified = formData.verificationStatus === 'VERIFIED';

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary tracking-tight">
            Developer Organization Profile
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-0.5">
            Public-facing organization identity, links, and verification status.
          </p>
        </div>

        {user?.id && (
          <Link to={`/developers/${user.id}`} target="_blank">
            <Button variant="ghost" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
              View Public Profile
            </Button>
          </Link>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'error'
              ? 'bg-accent-rose/10 border border-accent-rose/20 text-accent-rose'
              : 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="p-5 rounded-2xl bg-surface border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-content-primary">
              Verification Status
            </span>
            <span className="text-[11px] text-content-muted">
              {isVerified
                ? 'Your developer identity and organization have been cryptographically verified.'
                : 'Your profile is currently unverified. Verified accounts display a badge on app cards.'}
            </span>
          </div>
        </div>
        <Badge variant={isVerified ? 'published' : 'warning'} dot>
          {formData.verificationStatus}
        </Badge>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Card padding="lg" className="flex flex-col gap-5 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-2 border-b border-white/5">
            Organization Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Developer / Studio Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Company / Legal Entity</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. AuraHealth Technologies Inc."
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-primary">Profile Image / Avatar URL</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-content-dim" />
                )}
              </div>
              <input
                type="url"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://example.com/avatar.png"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-primary">Developer Bio</label>
            <textarea
              rows={4}
              value={formData.developerBio}
              onChange={(e) => setFormData({ ...formData, developerBio: e.target.value })}
              placeholder="Describe your studio, focus areas, and Android development background..."
              className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>
        </Card>

        {/* Online Presence & Links */}
        <Card padding="lg" className="flex flex-col gap-4 shadow-glass">
          <h2 className="text-base font-heading font-bold text-content-primary pb-2 border-b border-white/5">
            Online Presence & Portfolios
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Website URL</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourdomain.com"
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">GitHub Profile URL</label>
              <input
                type="url"
                value={formData.githubProfile}
                onChange={(e) => setFormData({ ...formData, githubProfile: e.target.value })}
                placeholder="https://github.com/username"
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-content-primary">Portfolio URL</label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://portfolio.me"
                className="px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperProfileSettingsPage;
