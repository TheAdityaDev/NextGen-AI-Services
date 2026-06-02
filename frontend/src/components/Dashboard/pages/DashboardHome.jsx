import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  MessageCircle, 
  Star, 
  AlertTriangle, 
  UserPlus,
  Clock
} from 'lucide-react';
import './DashboardHome.scss';
import apiService from '../../../services/api';
import socketService from '../../../services/socket';
import { useAuth } from '../../../contexts/AuthContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      <div className="chart-tooltip__value">{payload[0].value} tickets</div>
    </div>
  );
};

const DashboardHome = () => {
  const { getFullName } = useAuth();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load dashboard data from API
    loadDashboardData();
    
    // Connect socket for real-time updates
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for real-time updates
    const handleNotification = (notification) => {
      // Refresh dashboard data when relevant notifications arrive
      if (notification.type === 'ticket_created' || notification.type === 'ticket_resolved') {
        loadDashboardData();
      }
    };

    socketService.onNotification(handleNotification);

    return () => {
      socketService.offNotification(handleNotification);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDashboardOverview();
      
      if (response.success && response.data) {
        const { summary, ticketTrend, recentActivity } = response.data;

        // Map backend shape → component shape
        const stats = summary ? [
          { label: 'Total Tickets',        value: summary.totalTickets ?? 0,       delta: 'All time',   color: 'ghost' },
          { label: 'Active Conversations', value: summary.activeConversations ?? 0, delta: 'Open + In Progress', color: 'blue' },
          { label: 'AI Resolution Rate',   value: `${summary.aiResolutionRate ?? 0}%`, delta: 'AI handled', color: 'green' },
          { label: 'CSAT Score',           value: summary.csatScore ?? '—',        delta: 'Avg rating',  color: 'yellow' },
        ] : [];

        // Map ticketTrend [{date, count}] → [{day, tickets}]
        const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const chartData = (ticketTrend || []).map(t => ({
          day: DAY_LABELS[new Date(t.date).getDay()] ?? t.date,
          tickets: t.count ?? 0,
        }));

        // Map recent tickets → activity items
        const activityItems = (recentActivity || []).slice(0, 4).map(t => ({
          icon: t.status === 'resolved' ? 'CheckCircle' : 'MessageCircle',
          color: t.status === 'resolved' ? 'green' : t.priority === 'urgent' ? 'red' : 'blue',
          text: `#${t.ticketNumber} — ${t.title}`,
          time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        setDashboardData({ stats, chartData, recentActivity: activityItems });
      } else {
        setDashboardData({ stats: [], chartData: [], recentActivity: [] });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message);
      setDashboardData({ stats: [], chartData: [], recentActivity: [] });
    } finally {
      setLoading(false);
    }
  };

  // Use API data only, no fallback to static data
  const stats = dashboardData?.stats || [];
  const ticketData = dashboardData?.chartData || [];
  const activity = dashboardData?.recentActivity || [];

  return (
  <div className="db-page dash-home">
    <div className="db-page__header">
      <h1 className="db-page__title">Good morning, {getFullName() || 'there'} 👋</h1>
      <p className="db-page__sub">Here's what's happening with your support system today.</p>
    </div>

    {loading && (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )}

    {error && (
      <div className="dashboard-error">
        <p>Failed to load dashboard data: {error}</p>
        <button onClick={loadDashboardData} className="retry-btn">
          Retry
        </button>
      </div>
    )}

    {!loading && !error && (
      <>
        {/* Stats */}
        <div className="stats-grid">
          {stats.length > 0 ? (
            stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value">{s.value}</div>
                <div className={`stat-card__delta badge badge--${s.color}`}>{s.delta}</div>
              </div>
            ))
          ) : (
            <div className="dashboard-empty">
              <p>No dashboard statistics available</p>
            </div>
          )}
        </div>

        <div className="two-col">
          {/* Left column - Chart + Agent Insight */}
          <div className="dash-home__left-col">
            {/* Bar chart */}
            <div className="db-card dash-home__chart-card">
              <div className="dash-home__card-header">
                <span className="dash-home__card-title">Tickets per day</span>
                <span className="badge badge--ghost">This week</span>
              </div>
              {ticketData.length > 0 ? (
                <ResponsiveContainer width="100%" height={134}>
                  <BarChart
                    data={ticketData}
                    margin={{ 
                      top: 10, 
                      right: 0, 
                      left: -28, 
                      bottom: 5
                    }}
                    barCategoryGap="30%"
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(240,240,240,0.3)', fontSize: 11 }}
                      height={15}
                    />
                    <YAxis hide domain={[0, 'dataMax']} />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    />
                    <Bar dataKey="tickets" radius={[5, 5, 0, 0]} maxBarSize={40}>
                      {(ticketData || []).map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === 5
                            ? 'rgba(160,255,180,0.55)'
                            : 'rgba(255,255,255,0.08)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <p>No chart data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="dash-home__right-col">
          {/* Activity */}
            <div className="db-card dash-home__activity">
              <div className="dash-home__card-header">
                <span className="dash-home__card-title">Recent Activity</span>
              </div>
              <div className="dash-home__activity-list">
                {activity.length > 0 ? (
                  activity.slice(0, 4).map((a, i) => {
                    // Handle icon rendering safely
                    const getIcon = (iconName) => {
                      switch(iconName) {
                        case 'CheckCircle': return <CheckCircle size={12} />;
                        case 'MessageCircle': return <MessageCircle size={12} />;
                        case 'Star': return <Star size={12} />;
                        case 'AlertTriangle': return <AlertTriangle size={12} />;
                        case 'UserPlus': return <UserPlus size={12} />;
                        case 'Clock': return <Clock size={12} />;
                        default: return <MessageCircle size={12} />;
                      }
                    };

                    return (
                      <div key={i} className="dash-home__activity-item">
                        <span className={`dash-home__activity-icon badge--${a.color || 'blue'}`}>
                          {typeof a.icon === 'string' ? getIcon(a.icon) : <MessageCircle size={12} />}
                        </span>
                        <span className="dash-home__activity-text">{a.text}</span>
                        <span className="dash-home__activity-time">{a.time}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="activity-empty">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
};

export default DashboardHome;