import { useState, useEffect } from 'react';
import './ChatWidget.scss';
import apiService from '../../../services/api';

const ChatWidget = () => {
  const [config, setConfig] = useState({
    primaryColor: '#6366f1',
    welcomeMessage: '👋 Hi there! How can we help you today?',
    widgetPosition: 'bottom-right',
    isOnline: true,
    offlineMessage: 'We are currently offline. Leave us a message and we will get back to you.',
    companyName: '',
    companyLogo: '',
    showBranding: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWidgetConfig();
  }, []);

  const loadWidgetConfig = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWidgetConfig();
      if (response.success) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateWidgetConfig(config);
      if (response.success) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to save widget config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="db-page chatwidget">
        <div className="db-page__header">
          <h1 className="db-page__title">Chat Widget</h1>
          <p className="db-page__sub">Customize your embeddable support widget.</p>
        </div>
        <div className="chatwidget__loading">
          <div className="loading-spinner"></div>
          <p>Loading widget configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page chatwidget">
      <div className="db-page__header">
        <h1 className="db-page__title">Chat Widget</h1>
        <p className="db-page__sub">Customize your embeddable support widget.</p>
      </div>
      
      <div className="two-col">
        <div className="chatwidget__settings">
          {/* Appearance Settings */}
          <div className="db-card">
            <div className="chatwidget__section-title">Appearance</div>
            
            <div className="chatwidget__field">
              <label>Primary Color</label>
              <div className="chatwidget__color-input">
                <input 
                  type="color" 
                  value={config.primaryColor} 
                  onChange={e => handleConfigChange('primaryColor', e.target.value)}
                  className="chatwidget__color" 
                />
                <span className="chatwidget__color-value">{config.primaryColor}</span>
              </div>
            </div>

            <div className="chatwidget__field">
              <label>Widget Position</label>
              <select 
                value={config.widgetPosition}
                onChange={e => handleConfigChange('widgetPosition', e.target.value)}
                className="db-input"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>

            <div className="chatwidget__field">
              <label>Company Name</label>
              <input 
                type="text"
                value={config.companyName}
                onChange={e => handleConfigChange('companyName', e.target.value)}
                className="db-input"
                placeholder="Your Company Name"
              />
            </div>

            <div className="chatwidget__field">
              <label>Company Logo URL</label>
              <input 
                type="text"
                value={config.companyLogo || ''}
                onChange={e => handleConfigChange('companyLogo', e.target.value)}
                className="db-input"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Messages Settings */}
          <div className="db-card">
            <div className="chatwidget__section-title">Messages</div>
            
            <div className="chatwidget__field">
              <label>Welcome Message</label>
              <textarea 
                value={config.welcomeMessage}
                onChange={e => handleConfigChange('welcomeMessage', e.target.value)}
                className="db-input chatwidget__textarea"
                placeholder="Hi there! How can we help?"
                rows="3"
              />
            </div>

            <div className="chatwidget__field">
              <label>Offline Message</label>
              <textarea 
                value={config.offlineMessage}
                onChange={e => handleConfigChange('offlineMessage', e.target.value)}
                className="db-input chatwidget__textarea"
                placeholder="We're currently offline..."
                rows="3"
              />
            </div>

            <div className="chatwidget__field">
              <label className="chatwidget__toggle-row">
                <span>Widget is online</span>
                <label className="db-toggle">
                  <input
                    type="checkbox"
                    checked={config.isOnline}
                    onChange={e => handleConfigChange('isOnline', e.target.checked)}
                  />
                  <span className="db-toggle__track">
                    <span className="db-toggle__thumb" />
                  </span>
                </label>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={saveConfig}
            disabled={saving}
            className="db-btn db-btn--primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Live Preview */}
        <div className="chatwidget__preview">
          <div className="chatwidget__preview-label">Live Preview</div>
          <div className="chatwidget__window" style={{ '--primary-color': config.primaryColor }}>
            <div className="chatwidget__win-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {config.companyLogo ? (
                  <img src={config.companyLogo} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>CF</div>
                )}
                <div>
                  <div className="chatwidget__win-title" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                    {config.companyName || 'Support Chat'}
                  </div>
                  <div className="chatwidget__win-status" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.8 }}>
                    <span className={`chatwidget__status-dot ${config.isOnline ? 'online' : 'offline'}`} style={{ width: '6px', height: '6px' }}></span>
                    <span className="chatwidget__status-text">
                      {config.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="chatwidget__win-close">×</button>
            </div>
            <div className="chatwidget__win-body">
              <div className="chatwidget__win-bubble">
                {config.isOnline ? config.welcomeMessage : config.offlineMessage}
              </div>
            </div>
            <div className="chatwidget__win-input">
              <input 
                placeholder={config.isOnline ? "Type a message…" : "Leave a message..."}
                readOnly 
              />
              <button 
                className="chatwidget__send-btn"
                style={{ backgroundColor: config.primaryColor }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;