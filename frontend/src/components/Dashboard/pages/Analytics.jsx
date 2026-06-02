import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useState, useEffect } from 'react';
import './Analytics.scss';
import apiService from '../../../services/api';

const STATUS_META = {
  open:        { label: 'Open',        badge: 'blue'   },
  in_progress: { label: 'In Progress', badge: 'yellow' },
  resolved:    { label: 'Resolved',    badge: 'green'  },
  closed:      { label: 'Closed',      badge: 'ghost'  },
  escalated:   { label: 'Escalated',   badge: 'red'    },
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      <div className="chart-tooltip__value">{payload[0].value} tickets</div>
    </div>
  );
};

const Analytics = () => {
  const [data, setData]       = useState(null);
  const [team, setTeam]       = useState([]);
  const [range, setRange]     = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    load();
  }, [range]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, teamRes] = await Promise.all([
        apiService.getAnalyticsOverview(range),
        apiService.getTeam().catch(() => ({ success: false })),
      ]);
      if (analyticsRes.success) setData(analyticsRes.data);
      if (teamRes.success && teamRes.data) {
        setTeam(Array.isArray(teamRes.data.members) ? teamRes.data.members : []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────
  const statusBreakdown = data?.statusBreakdown || [];
  const totalTickets    = statusBreakdown.reduce((s, x) => s + x.count, 0);

  // Map volumeByDay → chart-friendly [{day, tickets}]
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const trendData = (data?.volumeByDay || []).slice(-7).map(t => ({
    day: DAY[new Date(t.date).getDay()],
    tickets: t.total,
  }));

  const aiRate   = data?.aiVsHuman?.aiRate   ?? 0;
  const humanRate = 100 - aiRate;

  // Agent performance from backend, fallback to team list
  const agentRows = data?.agentPerformance?.length
    ? data.agentPerformance
    : team.map(m => ({
        name: `${m.firstName} ${m.lastName}`.trim(),
        totalAssigned: 0,
        resolved: 0,
        resolutionRate: 0,
        avgResponseTime: null,
      }));

  return (
    <div className="db-page analytics">
      <div className="db-page__header">
        <h1 className="db-page__title">Analytics</h1>
        <p className="db-page__sub">Business intelligence and performance metrics.</p>
        <div className="analytics__range-tabs">
          {['7d','30d','90d'].map(r => (
            <button
              key={r}
              className={`analytics__range-btn ${range === r ? 'analytics__range-btn--active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading analytics…</p>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          <p>Failed to load analytics: {error}</p>
          <button onClick={load} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Ticket status breakdown ── */}
          <div className="stats-grid">
            {statusBreakdown.length > 0 ? statusBreakdown.map(s => {
              const meta = STATUS_META[s.status] || { label: s.status, color: 'ghost' };
              const pct  = totalTickets > 0 ? Math.round((s.count / totalTickets) * 100) : 0;
              return (
                <div key={s.status} className="stat-card">
                  <div className="stat-card__label">{meta.label}</div>
                  <div className="stat-card__value">{s.count}</div>
                  <div className={`stat-card__delta badge badge--${meta.badge}`}>{pct}% of total</div>
                </div>
              );
            }) : (
              <div className="dashboard-empty">
                <p>No ticket data yet</p>
              </div>
            )}
          </div>

          {/* ── Charts row ── */}
          <div className="two-col" style={{ marginBottom: 16 }}>

            {/* Ticket trend bar chart */}
            <div className="db-card analytics__chart-card">
              <div className="analytics__chart-header">
                <span className="analytics__chart-title">Ticket Volume</span>
                <span className="badge badge--ghost">{range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}</span>
              </div>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={trendData}
                    margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(240,240,240,0.3)', fontSize: 11 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={<BarTooltip />}
                      cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    />
                    <Bar dataKey="tickets" radius={[5, 5, 0, 0]} maxBarSize={40}>
                      {trendData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === trendData.length - 1
                            ? 'rgba(160,255,180,0.55)'
                            : 'rgba(255,255,255,0.08)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty"><p>No data for this period</p></div>
              )}
            </div>

            {/* AI vs Human donut */}
            <div className="db-card analytics__donut-card">
              <div className="analytics__chart-header">
                <span className="analytics__chart-title">AI vs Human Handled</span>
              </div>
              <div className="analytics__donut-wrap">
                <svg viewBox="0 0 80 80" className="analytics__donut">
                  <circle cx="40" cy="40" r="28" fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  <circle cx="40" cy="40" r="28" fill="none"
                    stroke="rgba(160,255,180,0.5)" strokeWidth="12"
                    strokeDasharray={`${(aiRate / 100) * 175.9} 175.9`}
                    strokeDashoffset="0" strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                  <circle cx="40" cy="40" r="28" fill="none"
                    stroke="rgba(120,180,255,0.4)" strokeWidth="12"
                    strokeDasharray={`${(humanRate / 100) * 175.9} 175.9`}
                    strokeDashoffset={`-${(aiRate / 100) * 175.9}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                </svg>
                <div className="analytics__donut-center">
                  {aiRate}%<br /><span>AI</span>
                </div>
              </div>
              <div className="analytics__donut-legend">
                <div className="analytics__legend-item">
                  <span className="analytics__legend-dot analytics__legend-dot--green" />
                  AI handled — {aiRate}%
                </div>
                <div className="analytics__legend-item">
                  <span className="analytics__legend-dot analytics__legend-dot--blue" />
                  Human handled — {humanRate}%
                </div>
              </div>
            </div>
          </div>

          {/* ── Agent / Team table ── */}
          <div className="db-card analytics__table-card">
            <div className="analytics__chart-header" style={{ marginBottom: 16 }}>
              <span className="analytics__chart-title">Team Performance</span>
              <span className="badge badge--ghost">{agentRows.length} member{agentRows.length !== 1 ? 's' : ''}</span>
            </div>
            {agentRows.length > 0 ? (
              <table className="analytics__table">
                <thead>
                  <tr>
                    {['Agent', 'Assigned', 'Resolved', 'Resolution Rate', 'Avg Response'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map((a, i) => (
                    <tr key={i} className="analytics__row">
                      <td className="analytics__agent-name">{a.name}</td>
                      <td className="analytics__cell">{a.totalAssigned}</td>
                      <td className="analytics__cell">{a.resolved}</td>
                      <td>
                        <span className={`badge badge--${a.resolutionRate >= 70 ? 'green' : a.resolutionRate >= 40 ? 'yellow' : 'ghost'}`}>
                          {a.resolutionRate}%
                        </span>
                      </td>
                      <td className="analytics__cell analytics__cell--mono">
                        {a.avgResponseTime != null ? `${a.avgResponseTime}m` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="dashboard-empty">
                <p>No team members found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
