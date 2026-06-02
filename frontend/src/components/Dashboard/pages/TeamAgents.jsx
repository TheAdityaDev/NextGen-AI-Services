import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import './TeamAgents.scss';
import apiService from '../../../services/api';

const ROLE_LABEL = {
  company_admin: 'Admin',
  support_agent: 'Agent',
};

const TeamAgents = () => {
  const [members, setMembers]         = useState([]);
  const [inviteCode, setInviteCode]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamRes, codeRes] = await Promise.all([
        apiService.getTeam(),
        apiService.getTeamInviteCode().catch(() => ({ success: false })),
      ]);
      if (teamRes.success) {
        setMembers(teamRes.data.members || []);
      }
      if (codeRes.success) {
        setInviteCode(codeRes.data.inviteCode || '');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="db-page team">
      <div className="db-page__header">
        <h1 className="db-page__title">Team & Agents</h1>
        <p className="db-page__sub">Manage your support team and their access.</p>
      </div>

      {/* Invite row */}
      {inviteCode && (
        <div className="db-card team__invite-row">
          <div className="team__invite-info">
            <span className="team__invite-label">Invite Code</span>
            <code className="team__invite-code">{inviteCode}</code>
          </div>
          <button className="db-btn db-btn--ghost" onClick={copyInviteCode}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {loading && (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading team…</p>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          <p>Failed to load team: {error}</p>
          <button onClick={load} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="dashboard-empty">
          <p>No team members yet. Share your invite code to add agents.</p>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <div className="three-col">
          {members.map(m => {
            const name     = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email;
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const role     = ROLE_LABEL[m.role] || m.role;
            const tickets  = m.tickets?.total ?? 0;
            const csat     = m.csat?.avg > 0 ? m.csat.avg.toFixed(1) : '—';

            return (
              <div key={m._id} className="db-card team__card">
                <div className="team__card-top">
                  <div className="team__avatar">{initials}</div>
                  <span className={`badge badge--${m.isOnline ? 'green' : 'ghost'}`}>
                    {m.isOnline ? 'online' : 'offline'}
                  </span>
                </div>
                <div className="team__name">{name}</div>
                <div className="team__role">{role}</div>
                <div className="team__email">{m.email}</div>
                <div className="team__stats">
                  <div className="team__stat">
                    <span>{tickets}</span>
                    <label>Tickets</label>
                  </div>
                  <div className="team__stat">
                    <span>{csat}</span>
                    <label>CSAT</label>
                  </div>
                  <div className="team__stat">
                    <span>{m.tickets?.resolved ?? 0}</span>
                    <label>Resolved</label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamAgents;
