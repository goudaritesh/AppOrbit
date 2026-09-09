import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Github,
  Globe,
  Phone,
  FileText,
  Save,
  RotateCcw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { authApi } from '../../api/authApi';
import { updateUser } from '../../store/slices/authSlice';
import { formatDate } from '../../utils/formatters';

export const UserProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phoneNumber: user?.phoneNumber || '',
    githubUrl: user?.githubUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile(formData);
      if (response?.data?.user) {
        dispatch(updateUser(response.data.user));
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const roleBadges = {
    USER: 'neutral',
    DEVELOPER: 'info',
    ADMIN: 'warning',
    SUPER_ADMIN: 'success',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-extrabold font-heading text-content-primary tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-content-muted">
          Manage your personal identity, public developer links, and profile details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card Overview */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold font-heading mb-4 shadow-glow">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AO'}
            </div>

            <h3 className="font-heading font-bold text-base text-content-primary mb-1">
              {user?.name}
            </h3>
            <p className="text-xs text-content-muted font-mono mb-4">{user?.email}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <Badge variant={roleBadges[user?.role] || 'neutral'}>
                {user?.role}
              </Badge>
              <Badge variant={user?.emailVerified ? 'success' : 'warning'}>
                {user?.emailVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>

            <div className="w-full pt-4 border-t border-white/5 flex flex-col gap-2 text-left text-xs text-content-dim">
              <div className="flex items-center justify-between">
                <span>Account Status</span>
                <span className="font-mono text-content-primary capitalize">
                  {user?.accountStatus?.toLowerCase().replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Member Since</span>
                <span className="font-mono text-content-primary">
                  {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-base font-bold font-heading text-content-primary mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-content-muted mb-6">
              These details are attached to your platform identity and developer contributions.
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                icon={<User className="w-4 h-4" />}
              />

              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-content-secondary">
                  Email Address (Read-Only)
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-content-dim pointer-events-none" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-surface-low text-content-dim text-sm rounded-lg border border-white/5 pl-10 pr-3.5 py-2.5 cursor-not-allowed font-mono"
                  />
                </div>
                <span className="text-[11px] text-content-dim">
                  Email modifications require administrative verification for security.
                </span>
              </div>

              <Textarea
                label="Biography"
                rows={3}
                placeholder="Tell the community about yourself or your software engineering studio..."
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                helperText="Maximum 500 characters"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Profile URL"
                  placeholder="https://github.com/username"
                  value={formData.githubUrl}
                  onChange={(e) => handleChange('githubUrl', e.target.value)}
                  icon={<Github className="w-4 h-4" />}
                />

                <Input
                  label="Portfolio / Website URL"
                  placeholder="https://yourwebsite.dev"
                  value={formData.portfolioUrl}
                  onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                  icon={<Globe className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Contact Phone Number"
                placeholder="+1 (555) 000-0000"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                icon={<Phone className="w-4 h-4" />}
              />

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
