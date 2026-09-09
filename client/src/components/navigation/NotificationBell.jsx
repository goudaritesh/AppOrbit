import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Crown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import {
  setNotifications,
  setUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/slices/notificationSlice';

export const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notification);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch unread count and initial notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (res?.data?.unreadCount !== undefined) {
          dispatch(setUnreadCount(res.data.unreadCount));
        }
      } catch (err) {
        // silent fail
      }
    };

    fetchUnread();
  }, [isAuthenticated, dispatch]);

  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setLoading(true);
      try {
        const res = await notificationApi.getNotifications({ limit: 5 });
        if (res?.data?.notifications) {
          dispatch(setNotifications(res.data.notifications));
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      dispatch(markNotificationRead(id));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      dispatch(markAllNotificationsRead());
    } catch (err) {
      // ignore
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'SUBSCRIPTION_ACTIVATED':
      case 'SUBSCRIPTION_EXPIRING':
      case 'SUBSCRIPTION_EXPIRED':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'APP_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'APP_REJECTED':
      case 'APP_BLOCKED':
        return <XCircle className="w-4 h-4 text-accent-rose" />;
      case 'APK_SECURITY_COMPLETED':
      case 'APK_SECURITY_FAILED':
        return <Shield className="w-4 h-4 text-accent-cyan" />;
      case 'SUPPORT_REPLY':
      case 'SUPPORT_TICKET_UPDATED':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-content-dim" />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="p-2 rounded-xl text-content-muted hover:text-white hover:bg-white/5 transition-all relative"
        title="Notifications"
        aria-label="View notifications"
        id="notification-bell-btn"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-rose text-white text-[10px] font-bold font-mono flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-low border border-white/10 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-accent-rose/20 border border-accent-rose/30 text-accent-rose text-[10px] font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-content-dim hover:text-primary transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="py-8 text-center text-xs text-content-dim font-mono">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-content-dim">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-content-dim opacity-50" />
                <span>All caught up! No notifications.</span>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif._id}
                  onClick={(e) => handleMarkRead(notif._id, e)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-surface border border-white/5 shrink-0">
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-content-primary truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] font-mono text-content-dim shrink-0">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-white/10 bg-surface/30 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-light transition-colors"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
