import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  Settings,
  Shield,
  Smartphone,
  AlertTriangle,
  Mail,
  Save,
  RefreshCw,
  Power,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [reason, setReason] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res.data?.success) {
        setSettings(res.data.data.settings);
      }
    } catch (err) {
      console.error('Failed to load platform settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('An administrative reason is required to update platform settings');
      return;
    }

    try {
      setSaving(true);
      const res = await adminApi.updateSettings({
        ...settings,
        reason: reason.trim()
      });
      if (res.data?.success) {
        toast.success('Platform settings updated successfully');
        setSettings(res.data.data.settings);
        setReason('');
      }
    } catch (err) {
      console.error('Settings save error:', err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-brand-primary" />
          Platform Configuration & Settings
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage system-wide parameters, storage thresholds, security scan policies, and platform maintenance mode.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-primary gap-4">
        {[
          { id: 'general', label: 'General & Contact', icon: Sliders },
          { id: 'apps', label: 'Application Policies', icon: Smartphone },
          { id: 'security', label: 'Security & Scans', icon: Shield },
          { id: 'maintenance', label: 'Maintenance Mode', icon: Power }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && settings?.general && (
          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary space-y-4">
            <h2 className="text-base font-bold text-white mb-4">General Platform Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Platform Name</label>
                <input
                  type="text"
                  value={settings.general.platformName || ''}
                  onChange={(e) => handleInputChange('general', 'platformName', e.target.value)}
                  className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Support Contact Email</label>
                <input
                  type="email"
                  value={settings.general.supportEmail || ''}
                  onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                  className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Platform Description</label>
              <textarea
                rows={2}
                value={settings.general.platformDescription || ''}
                onChange={(e) => handleInputChange('general', 'platformDescription', e.target.value)}
                className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Application Policies Tab */}
        {activeTab === 'apps' && settings?.applications && (
          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary space-y-4">
            <h2 className="text-base font-bold text-white mb-4">Application Policies & Upload Limits</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Maximum APK Size (Bytes)
                </label>
                <input
                  type="number"
                  value={settings.applications.maxApkSizeBytes || 104857600}
                  onChange={(e) =>
                    handleInputChange('applications', 'maxApkSizeBytes', parseInt(e.target.value, 10))
                  }
                  className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
                <span className="text-[11px] text-text-muted">
                  Default: 104857600 (100 MB)
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Maximum Screenshots per Listing
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={settings.applications.maxScreenshotsCount || 8}
                  onChange={(e) =>
                    handleInputChange('applications', 'maxScreenshotsCount', parseInt(e.target.value, 10))
                  }
                  className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="reviewRequired"
                checked={settings.applications.reviewRequired ?? true}
                onChange={(e) => handleInputChange('applications', 'reviewRequired', e.target.checked)}
                className="rounded border-border-primary text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="reviewRequired" className="text-sm font-medium text-white cursor-pointer">
                Require Mandatory Administrator Review before Publishing
              </label>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && settings?.security && (
          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary space-y-4">
            <h2 className="text-base font-bold text-white mb-4">APK Security & Risk Thresholds</h2>

            <div className="flex items-center gap-3 pb-2 border-b border-border-primary/60">
              <input
                type="checkbox"
                id="securityScanEnabled"
                checked={settings.security.securityScanEnabled ?? true}
                onChange={(e) => handleInputChange('security', 'securityScanEnabled', e.target.checked)}
                className="rounded border-border-primary text-brand-primary focus:ring-brand-primary"
              />
              <div>
                <label htmlFor="securityScanEnabled" className="text-sm font-medium text-white cursor-pointer block">
                  Enable Automated APK Malware & Certificate Scanning
                </label>
                <span className="text-xs text-text-muted">
                  Runs static analysis, hash integrity checks, signature parsing, and risk scoring.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Manual Review Risk Threshold (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.security.manualReviewRiskThreshold || 40}
                  onChange={(e) =>
                    handleInputChange(
                      'security',
                      'manualReviewRiskThreshold',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
                <span className="text-[11px] text-text-muted">
                  Scores above this threshold require manual security reviewer sign-off.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Mode Tab */}
        {activeTab === 'maintenance' && settings?.maintenance && (
          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold text-white">Platform Maintenance Controller</h2>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <strong>Emergency Mode:</strong> Enabling maintenance mode returns HTTP 503 Service Unavailable to all public users and developers. Authenticated administrators retain full bypass access to all admin tools.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="maintenanceEnabled"
                checked={settings.maintenance.isEnabled ?? false}
                onChange={(e) => handleInputChange('maintenance', 'isEnabled', e.target.checked)}
                className="w-4 h-4 rounded border-border-primary text-red-600 focus:ring-red-500"
              />
              <label
                htmlFor="maintenanceEnabled"
                className={`text-sm font-bold cursor-pointer ${
                  settings.maintenance.isEnabled ? 'text-red-400' : 'text-white'
                }`}
              >
                {settings.maintenance.isEnabled
                  ? 'MAINTENANCE MODE ACTIVE (Public Locked)'
                  : 'Enable Maintenance Mode'}
              </label>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-text-secondary">
                Public Maintenance Message
              </label>
              <textarea
                rows={2}
                value={settings.maintenance.message || ''}
                onChange={(e) => handleInputChange('maintenance', 'message', e.target.value)}
                placeholder="AppOrbit is currently undergoing scheduled platform upgrades. Normal service will resume shortly."
                className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Audit Justification Reason Box */}
        <div className="p-4 bg-surface-secondary rounded-xl border border-brand-primary/30 space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Mandatory Audit Justification</span>
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="State the reason for this administrative configuration change..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-surface-tertiary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={fetchSettings}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="flex items-center gap-2 px-6"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
