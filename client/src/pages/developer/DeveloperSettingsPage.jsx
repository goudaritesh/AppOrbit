import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Settings,
  Bell,
  Lock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export const DeveloperSettingsPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState({
    reviewUpdates: true,
    securityAlerts: true,
    downloadMilestones: false,
    newsletter: false,
  });

  const [saved, setSaved] = useState(false);
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSaveNotifications = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary tracking-tight">
          Developer Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-content-muted mt-0.5">
          Configure preferences, alerts, account security, and distribution parameters.
        </p>
      </div>

      {/* 1. ACCOUNT OVERVIEW CARD */}
      <Card padding="lg" className="flex flex-col gap-4 shadow-glass">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h2 className="text-base font-heading font-bold text-content-primary">
            Account Information
          </h2>
          <Badge variant="published" dot>
            {user?.role || 'DEVELOPER'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-elevated">
            <span className="text-content-muted">Developer Name</span>
            <span className="text-content-primary font-bold">{user?.name}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-elevated">
            <span className="text-content-muted">Email Address</span>
            <span className="text-content-primary font-bold">{user?.email}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Link to="/developer/profile">
            <Button variant="outline" size="sm">
              Edit Organization Profile
            </Button>
          </Link>
        </div>
      </Card>

      {/* 2. NOTIFICATIONS PREFERENCES */}
      <Card padding="lg" className="flex flex-col gap-5 shadow-glass">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-base font-heading font-bold text-content-primary">
              Notification Preferences
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Phase 10 Foundation
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              id: 'reviewUpdates',
              title: 'Application Review Status Updates',
              desc: 'Get notified when your application approval state transitions or requires revision.',
            },
            {
              id: 'securityAlerts',
              title: 'Malware & Signature Alerts',
              desc: 'Immediate notifications if security scanning flags potential issues with your APKs.',
            },
            {
              id: 'downloadMilestones',
              title: 'Download & Milestone Celebrations',
              desc: 'Weekly digests when your application crosses download thresholds.',
            },
            {
              id: 'newsletter',
              title: 'Developer Platform Announcements',
              desc: 'Updates regarding Android SDK changes, API releases, and policy modifications.',
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-start justify-between p-3.5 rounded-xl bg-surface-elevated border border-white/5 cursor-pointer hover:border-white/10 transition-colors"
            >
              <div className="flex flex-col gap-0.5 pr-4">
                <span className="text-xs font-semibold text-content-primary">{item.title}</span>
                <span className="text-[11px] text-content-muted leading-relaxed">
                  {item.desc}
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.id]}
                onChange={() => handleToggle(item.id)}
                className="mt-0.5 rounded border-white/20 bg-surface text-primary focus:ring-primary"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-accent-emerald flex items-center gap-1.5 font-mono">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          ) : (
            <div />
          )}
          <Button variant="primary" size="sm" onClick={handleSaveNotifications}>
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* 3. SECURITY SETTINGS */}
      <Card padding="lg" className="flex flex-col gap-4 shadow-glass">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-base font-heading font-bold text-content-primary">
              Security & Credentials
            </h2>
          </div>
        </div>

        <p className="text-xs text-content-secondary leading-relaxed">
          Manage your password and active session tokens. Passwords require at least 8 characters,
          one uppercase letter, and one number.
        </p>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-white/5">
          <div>
            <span className="text-xs font-semibold text-content-primary block">
              Password Security
            </span>
            <span className="text-[11px] text-content-muted">
              Secure your account with a cryptographically hashed password.
            </span>
          </div>
          <Link to="/forgot-password">
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </Link>
        </div>
      </Card>

      {/* 4. DANGER ZONE */}
      <Card padding="lg" className="flex flex-col gap-4 border border-accent-rose/20 shadow-glass">
        <div className="flex items-center gap-2 pb-2 border-b border-accent-rose/10 text-accent-rose">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-base font-heading font-bold">Danger Zone</h2>
        </div>

        <p className="text-xs text-content-secondary leading-relaxed">
          De-activating your developer workspace will withdraw your applications from the
          marketplace and archive all published release records.
        </p>

        <div className="flex justify-end pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDangerModalOpen(true)}
          >
            Request Workspace Deletion
          </Button>
        </div>
      </Card>

      {/* Danger Zone Modal */}
      <Modal
        isOpen={isDangerModalOpen}
        onClose={() => setIsDangerModalOpen(false)}
        title="Request Workspace Deletion"
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-content-secondary leading-relaxed">
            In accordance with platform safety policies, developers with published applications
            must initiate an offboarding review before workspace deletion can be finalized.
          </p>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-content-dim">
            Confirmation ticket reference: DEV-OFFBOARD-{Date.now().toString().slice(-6)}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDangerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                alert('Offboarding request ticket submitted to platform administrators.');
                setIsDangerModalOpen(false);
              }}
            >
              Submit Deletion Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeveloperSettingsPage;
