import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, ShieldCheck, Check, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import Button from '../../components/ui/Button';

export const DeveloperNotificationSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email: { enabled: true, frequency: 'INSTANT' },
    push: { enabled: true },
    application: true,
    payment: true,
    subscription: true,
    support: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getPreferences();
      if (res?.data?.preferences) {
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      toast.error('Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await notificationApi.updatePreferences(preferences);
      toast.success('Notification preferences updated.');
    } catch (err) {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handlePushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Web push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Push notification permissions granted!');
        // Generate simulated FCM device token for browser registration
        const mockToken = `fcm_web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await notificationApi.registerDeviceToken({
          token: mockToken,
          platform: 'WEB',
          deviceInfo: { userAgent: navigator.userAgent },
        });
        setPreferences((prev) => ({
          ...prev,
          push: { ...prev.push, enabled: true },
        }));
      } else {
        toast('Push notifications were not enabled.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Failed to enable web push notifications.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-in fade-in-50">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
          <Bell className="w-4 h-4" />
          <span>Alert Channels</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary">
          Notification Preferences
        </h1>
        <p className="text-xs text-content-secondary mt-1">
          Configure how and when AppOrbit alerts you across email, browser push, and WebSockets.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-content-dim">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading alert configurations...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Channel Settings Card */}
          <div className="rounded-3xl bg-surface-low border border-white/10 p-6 space-y-5">
            <h2 className="text-sm font-bold text-content-primary font-heading uppercase tracking-wider">
              Delivery Channels
            </h2>

            {/* Email Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Email Notifications
                  </div>
                  <div className="text-[11px] text-content-dim mt-0.5">
                    Receive receipts, security bulletins, and approval updates via email.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email?.enabled ?? true}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Browser Push Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Web Push Notifications (FCM)
                  </div>
                  <div className="text-[11px] text-content-dim mt-0.5">
                    Real-time desktop push when APK scans complete or payments clear.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePushPermission}
                  className="px-3 py-1 rounded-lg bg-surface-elevated border border-white/10 text-[11px] font-mono text-content-primary hover:text-white hover:border-white/20 transition-all"
                >
                  Prompt Browser
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push?.enabled ?? true}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        push: { ...preferences.push, enabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          </div>

          {/* Event Topic Subscription */}
          <div className="rounded-3xl bg-surface-low border border-white/10 p-6 space-y-4">
            <h2 className="text-sm font-bold text-content-primary font-heading uppercase tracking-wider">
              Notification Topics
            </h2>

            <div className="divide-y divide-white/5">
              {/* Apps */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Application Status Updates
                  </div>
                  <div className="text-[11px] text-content-dim">
                    Submissions, approvals, rejections, and security scanning reports.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.application ?? true}
                  onChange={(e) =>
                    setPreferences({ ...preferences, application: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/10 text-primary focus:ring-0 focus:outline-none bg-surface cursor-pointer"
                />
              </div>

              {/* Payments */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Billing & Payment Receipts
                  </div>
                  <div className="text-[11px] text-content-dim">
                    Invoices, payment clearance confirmations, and manual verification notices.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.payment ?? true}
                  onChange={(e) =>
                    setPreferences({ ...preferences, payment: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/10 text-primary focus:ring-0 focus:outline-none bg-surface cursor-pointer"
                />
              </div>

              {/* Subscriptions */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Subscription Lifecycle & Quota Alerts
                  </div>
                  <div className="text-[11px] text-content-dim">
                    Tier renewals, expiration warnings, and monthly quota resets.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.subscription ?? true}
                  onChange={(e) =>
                    setPreferences({ ...preferences, subscription: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/10 text-primary focus:ring-0 focus:outline-none bg-surface cursor-pointer"
                />
              </div>

              {/* Support */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-content-primary">
                    Support Ticket Replies
                  </div>
                  <div className="text-[11px] text-content-dim">
                    Real-time replies from platform support specialists.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.support ?? true}
                  onChange={(e) =>
                    setPreferences({ ...preferences, support: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/10 text-primary focus:ring-0 focus:outline-none bg-surface cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {saving ? 'Saving Settings...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeveloperNotificationSettingsPage;
