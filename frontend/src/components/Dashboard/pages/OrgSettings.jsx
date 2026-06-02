import { useState, useEffect } from 'react';
import './OrgSettings.scss';
import apiService from '../../../services/api';

const OrgSettings = () => {
  const [form, setForm]       = useState({
    companyName:       '',
    companyWebsite:    '',
    industryType:      '',
    countryRegion:     '',
    supportHoursOpen:  '',
    supportHoursClose: '',
    outOfHoursMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getOrganization();
      if (res.success) {
        const { tenant, supportConfig } = res.data;
        setForm({
          companyName:       tenant?.companyName       || '',
          companyWebsite:    tenant?.companyWebsite    || '',
          industryType:      tenant?.industryType      || '',
          countryRegion:     tenant?.countryRegion     || '',
          supportHoursOpen:  supportConfig?.supportHoursOpen  || '',
          supportHoursClose: supportConfig?.supportHoursClose || '',
          outOfHoursMessage: supportConfig?.outOfHoursMessage || '',
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await apiService.updateOrganization(form);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="db-page orgsettings">
        <div className="db-page__header">
          <h1 className="db-page__title">Organization Settings</h1>
          <p className="db-page__sub">Configure your company workspace.</p>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page orgsettings">
      <div className="db-page__header">
        <h1 className="db-page__title">Organization Settings</h1>
        <p className="db-page__sub">Configure your company workspace.</p>
      </div>

      {error && (
        <div className="dashboard-error" style={{ marginBottom: 16 }}>
          <p>{error}</p>
        </div>
      )}

      <div className="two-col">
        {/* General */}
        <div className="db-card">
          <div className="orgsettings__section-title">General</div>

          <div className="orgsettings__field">
            <label>Company Name</label>
            <input
              className="db-input"
              value={form.companyName}
              onChange={e => set('companyName', e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          <div className="orgsettings__field">
            <label>Website</label>
            <input
              className="db-input"
              value={form.companyWebsite}
              onChange={e => set('companyWebsite', e.target.value)}
              placeholder="https://acme.com"
            />
          </div>

          <div className="orgsettings__field">
            <label>Industry</label>
            <input
              className="db-input"
              value={form.industryType}
              onChange={e => set('industryType', e.target.value)}
              placeholder="e.g. SaaS, E-commerce"
            />
          </div>

          <div className="orgsettings__field">
            <label>Country / Region</label>
            <input
              className="db-input"
              value={form.countryRegion}
              onChange={e => set('countryRegion', e.target.value)}
              placeholder="e.g. United States"
            />
          </div>
        </div>

        {/* Support Hours */}
        <div className="db-card">
          <div className="orgsettings__section-title">Support Hours</div>

          <div className="orgsettings__field">
            <label>Opens at</label>
            <input
              className="db-input"
              type="time"
              value={form.supportHoursOpen}
              onChange={e => set('supportHoursOpen', e.target.value)}
            />
          </div>

          <div className="orgsettings__field">
            <label>Closes at</label>
            <input
              className="db-input"
              type="time"
              value={form.supportHoursClose}
              onChange={e => set('supportHoursClose', e.target.value)}
            />
          </div>

          <div className="orgsettings__field">
            <label>Out-of-hours message</label>
            <textarea
              className="db-input orgsettings__textarea"
              value={form.outOfHoursMessage}
              onChange={e => set('outOfHoursMessage', e.target.value)}
              placeholder="We're currently offline…"
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="orgsettings__footer">
        <button
          className="db-btn db-btn--primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default OrgSettings;
