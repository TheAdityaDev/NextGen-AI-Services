import { useState, useEffect } from 'react';
import { Star, Smile, Frown, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import apiService from '../../../services/api';
import './CSAT.scss';

const CSAT = () => {
  const [data, setData] = useState({ responses: [], total: 0, summary: { avg: 0, negativeCount: 0, totalResponses: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCsatData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCSAT();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load CSAT data:', err);
      setError(err.message || 'Failed to retrieve feedback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCsatData();
  }, []);

  if (loading) {
    return (
      <div className="csat__loading">
        <div className="loading-spinner"></div>
        <p>Loading CSAT analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="csat__error">
        <AlertCircle size={32} className="error-icon" />
        <p>Error: {error}</p>
        <button onClick={loadCsatData} className="retry-btn">Retry</button>
      </div>
    );
  }

  const { responses = [], summary = { avg: 0, negativeCount: 0, totalResponses: 0 } } = data;

  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let positiveCount = 0;
  let negativeCount = 0;

  responses.forEach(r => {
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
    if (r.rating >= 4) positiveCount++;
    if (r.rating <= 2) negativeCount++;
  });

  const totalRated = summary.totalResponses || responses.length || 1;
  const positiveRate = Math.round((positiveCount / totalRated) * 100);
  const negativeRate = Math.round((negativeCount / totalRated) * 100);

  const chartData = [
    { name: '1 Star', count: distribution[1], color: '#ef4444' }, // Red
    { name: '2 Stars', count: distribution[2], color: '#f97316' }, // Orange
    { name: '3 Stars', count: distribution[3], color: '#eab308' }, // Yellow
    { name: '4 Stars', count: distribution[4], color: '#3b82f6' }, // Blue
    { name: '5 Stars', count: distribution[5], color: '#10b981' }  // Green
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        className={i < rating ? 'star-icon star-icon--filled' : 'star-icon'} 
      />
    ));
  };

  return (
    <div className="db-page csat">
      <div className="db-page__header">
        <h1 className="db-page__title">CSAT / Feedback</h1>
        <p className="db-page__sub">Monitor customer satisfaction metrics and individual ticket feedback.</p>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="csat__kpi-grid">
        <div className="db-card kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Average CSAT</span>
            <div className="kpi-card__icon kpi-card__icon--blue">
              <Star size={18} />
            </div>
          </div>
          <div className="kpi-card__body">
            <span className="kpi-card__value">{summary.avg || '0.0'}</span>
            <span className="kpi-card__subtext">Out of 5.0 rating scale</span>
          </div>
        </div>

        <div className="db-card kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Positive Feedback</span>
            <div className="kpi-card__icon kpi-card__icon--green">
              <Smile size={18} />
            </div>
          </div>
          <div className="kpi-card__body">
            <span className="kpi-card__value">{positiveRate}%</span>
            <span className="kpi-card__subtext">Ratings of 4 & 5 stars</span>
          </div>
        </div>

        <div className="db-card kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Negative Feedback</span>
            <div className="kpi-card__icon kpi-card__icon--red">
              <Frown size={18} />
            </div>
          </div>
          <div className="kpi-card__body">
            <span className="kpi-card__value">{negativeRate}%</span>
            <span className="kpi-card__subtext">Ratings of 1 & 2 stars</span>
          </div>
        </div>

        <div className="db-card kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Total Responses</span>
            <div className="kpi-card__icon kpi-card__icon--purple">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-card__body">
            <span className="kpi-card__value">{summary.totalResponses || 0}</span>
            <span className="kpi-card__subtext">Ratings gathered so far</span>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="csat__analytics-grid">
        {/* Left: Ratings Distribution Chart */}
        <div className="db-card analytics-chart">
          <h3 className="analytics-chart__title">Score Distribution</h3>
          <p className="analytics-chart__subtitle">Count of responses per rating category</p>
          
          <div className="chart-container" style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feedback Comments Stream */}
        <div className="db-card feedback-list-card">
          <h3 className="feedback-list-card__title">Recent Feedback Comments</h3>
          <p className="feedback-list-card__subtitle">Customer suggestions and complaints</p>

          <div className="feedback-stream">
            {responses.length === 0 ? (
              <div className="feedback-stream__empty">
                <MessageSquare size={32} />
                <p>No feedback ratings received yet.</p>
              </div>
            ) : (
              responses.map((r) => (
                <div key={r._id} className="feedback-item">
                  <div className="feedback-item__header">
                    <div className="customer-info">
                      <strong className="customer-name">{r.customerName || 'Anonymous'}</strong>
                      <span className="customer-email">{r.customerEmail || 'no-email@customer.com'}</span>
                    </div>
                    <div className="rating-stars">
                      {renderStars(r.rating)}
                    </div>
                  </div>

                  {r.feedback && (
                    <div className="feedback-item__body">
                      <p>{r.feedback}</p>
                    </div>
                  )}

                  <div className="feedback-item__footer">
                    <span className="ticket-link">
                      Ticket #{r.ticketId?.ticketNumber || 'N/A'}
                    </span>
                    <span className="agent-badge">
                      Agent: {r.agentId ? `${r.agentId.firstName} ${r.agentId.lastName}` : 'Unassigned'}
                    </span>
                    <span className="date-stamp">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSAT;
