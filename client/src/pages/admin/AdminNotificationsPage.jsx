import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import Button from '../../components/ui/Button';
import {
  Bell,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  CheckCheck,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getNotifications({ unreadOnly: filterUnread ? 'true' : undefined });
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filterUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await adminApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Mark all read error:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'NORMAL':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-brand-primary" />
            Admin Notification & Alerts Center
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time platform alerts, urgent security notices, pending payments, and moderation queue activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterUnread(!filterUnread)}
            className={`text-xs ${filterUnread ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : ''}`}
          >
            {filterUnread ? 'Showing Unread' : 'Show All'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleMarkAllRead}
            className="text-xs text-text-muted hover:text-white flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 bg-surface-secondary border border-border-primary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-surface-secondary/50 rounded-2xl border border-border-primary">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-white">All Caught Up</h3>
          <p className="text-sm text-text-muted mt-1">
            There are no {filterUnread ? 'unread ' : ''}administrative alerts requiring your attention right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                !n.isRead
                  ? 'bg-surface-secondary border-brand-primary/40 shadow-sm'
                  : 'bg-surface-secondary/50 border-border-primary opacity-80 hover:opacity-100'
              }`}
            >
              {/* Icon */}
              <div className="p-2 rounded-lg bg-surface-tertiary shrink-0 mt-0.5">
                {getPriorityIcon(n.priority)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{n.title}</span>
                  <AdminBadge status={n.priority} />
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                  )}
                </div>

                <p className="text-xs text-text-secondary whitespace-pre-wrap">{n.message}</p>

                <div className="flex items-center gap-4 mt-2 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {n.eventType && (
                    <span className="font-mono text-[10px] uppercase bg-surface-tertiary px-1.5 py-0.5 rounded border border-border-primary">
                      {n.eventType}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {n.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(n.actionUrl)}
                    className="text-xs py-1 px-2.5 h-auto flex items-center gap-1 text-brand-accent hover:text-white"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(n._id)}
                    className="text-xs py-1 px-2 h-auto text-text-muted hover:text-white"
                    title="Mark as Read"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
