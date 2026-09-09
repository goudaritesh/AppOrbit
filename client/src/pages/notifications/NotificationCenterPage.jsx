import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CreditCard,
  Crown,
  CheckCircle2,
  XCircle,
  Shield,
  MessageSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import {
  setNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
} from '../../store/slices/notificationSlice';
import Button from '../../components/ui/Button';

export const NotificationCenterPage = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, [filter, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications({
        unreadOnly: filter === 'UNREAD',
        page,
        limit: 20,
      });

      if (res?.data?.notifications) {
        dispatch(setNotifications(res.data.notifications));
      }
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      dispatch(markNotificationRead(id));
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      dispatch(markAllNotificationsRead());
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      dispatch(removeNotification(id));
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'SUBSCRIPTION_ACTIVATED':
      case 'SUBSCRIPTION_EXPIRING':
      case 'SUBSCRIPTION_EXPIRED':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'APP_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'APP_REJECTED':
      case 'APP_BLOCKED':
        return <XCircle className="w-5 h-5 text-accent-rose" />;
      case 'APK_SECURITY_COMPLETED':
      case 'APK_SECURITY_FAILED':
        return <Shield className="w-5 h-5 text-accent-cyan" />;
      case 'SUPPORT_REPLY':
      case 'SUPPORT_TICKET_UPDATED':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      default:
        return <Bell className="w-5 h-5 text-content-dim" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary">
            Notification Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-surface border border-white/5">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all ${
                filter === 'ALL'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-content-dim hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-1.5 ${
                filter === 'UNREAD'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-content-dim hover:text-white'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-rose text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck className="w-3.5 h-3.5" />}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl bg-surface-low border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-content-dim">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading notification feed...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-content-dim">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
            <div className="text-sm font-semibold text-content-primary">
              No notifications found
            </div>
            <p className="text-xs text-content-dim mt-1">
              You're completely up to date with platform activity.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && handleMarkRead(notif._id)}
              className={`p-5 flex items-start gap-4 hover:bg-white/5 transition-all cursor-pointer group ${
                !notif.isRead ? 'bg-primary/5' : ''
              }`}
            >
              <div className="mt-1 p-2.5 rounded-2xl bg-surface border border-white/5 shrink-0">
                {getIconForType(notif.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-content-primary">
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-content-dim shrink-0">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-content-secondary leading-relaxed">
                  {notif.message}
                </p>

                {notif.data && (
                  <div className="pt-2 flex items-center gap-2">
                    {notif.data.planSlug && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-400">
                        Tier: {notif.data.planSlug}
                      </span>
                    )}
                    {notif.data.receiptNumber && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-accent-cyan">
                        Receipt: {notif.data.receiptNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => handleDelete(notif._id, e)}
                  className="p-1.5 rounded-lg text-content-dim hover:text-accent-rose hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
