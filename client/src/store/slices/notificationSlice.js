import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    email: { enabled: true, frequency: 'INSTANT' },
    push: { enabled: true },
    application: true,
    payment: true,
    subscription: true,
    support: true,
  },
  loading: false,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action) => {
      // Prepend newly arrived notification
      state.notifications = [action.payload, ...state.notifications];
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    markNotificationRead: (state, action) => {
      const id = action.payload;
      const notif = state.notifications.find((n) => n._id === id);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const id = action.payload;
      const index = state.notifications.findIndex((n) => n._id === id);
      if (index !== -1) {
        if (!state.notifications[index].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    setPreferences: (state, action) => {
      state.preferences = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  setUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  setPreferences,
  setLoading,
} = notificationSlice.actions;

export default notificationSlice.reducer;
