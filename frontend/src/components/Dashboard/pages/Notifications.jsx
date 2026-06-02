import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import './Notifications.scss';
import apiService from '../../../services/api';

// Map notification type → badge color + emoji
const TYPE_META = {
  ticket_escalated: { color: 'red',    icon: '⚠' },
  ticket_assigned:  { color: 'blue',   icon: '◎' },
  ticket_resolved:  { color: 'green',  icon: '✓' },
  new_message:      { color: 'blue',   icon: '◉' },
  ai_alert:         { color: 'yellow', icon: '◈' },
  csat_received:    { color: 'green',  icon: '★' },
  agent_joined:     { color: 'green',  icon: '◎' },
  ai_milestone:     { color: 'ghost',  icon: '◉' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [markingAll, setMarkingAll]       = useState(false);
  const [filter, setFilter]               = useState('all'); // 'all' | 'unread'

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filter === 'unread' ? { unreadOnly: 'true' } : {};
      const res = await apiService.getNotifications(params);
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await apiService.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all read:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id) => {
    try {
      await apiService.markNotificationsRead([id]);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <div className="db-page notifs">
      <div className="db-page__header">
        <h1 className="db-page__title">Notifications</h1>
        <p className="db-page__sub">Centralized alerts from across your platform.</p>
      </div>

      {/* Toolbar */}
      <div className="notifs__toolbar">
        <div className="notifs__filters">
          {['all', 'unread'].map(f => (
            <button
              key={f}
              className={`notifs__filter-btn ${filter === f ? 'notifs__filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            className="db-btn db-btn--ghost notifs__mark-all"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={13} />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading && (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading notifications…</p>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          <p>Failed to load notifications: {error}</p>
          <button onClick={load} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="notifs__empty">
          <Bell size={32} strokeWidth={1.2} />
          <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="notifs__list">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { color: 'ghost', icon: '◉' };
            return (
              <div
                key={n._id}
                className={`db-card notifs__item ${!n.isRead ? 'notifs__item--unread' : ''}`}
                onClick={() => !n.isRead && markOneRead(n._id)}
              >
                <div className={`notifs__icon badge--${meta.color}`}>{meta.icon}</div>
                <div className="notifs__content">
                  <div className="notifs__title">{n.title}</div>
                  <div className="notifs__body">{n.message}</div>
                </div>
                <div className="notifs__right">
                  <div className="notifs__time">{timeAgo(n.createdAt)}</div>
                  {!n.isRead && <span className="notifs__dot" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
