import { useState, useEffect } from 'react';
import { Copy, Check, Code2, Globe, Puzzle } from 'lucide-react';
import './Integrations.scss';
import apiService from '../../../services/api';

const Integrations = () => {
  const [embedScript, setEmbedScript] = useState('');
  const [widgetKey, setWidgetKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWidgetConfig();
  }, []);

  const loadWidgetConfig = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWidgetConfig();
      if (response.success) {
        setEmbedScript(response.data.embedScript || '');
        setWidgetKey(response.data.config?.widgetKey || '');
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="db-page integrations">
      <div className="db-page__header">
        <h1 className="db-page__title">Integrations</h1>
        <p className="db-page__sub">Connect NextGen AI Services to your website and other platforms.</p>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading integration details…</p>
        </div>
      ) : (
        <div className="integrations__grid">

          {/* Embed Code card */}
          <div className="db-card integrations__card integrations__card--featured">
            <div className="integrations__card-header">
              <div className="integrations__card-icon">
                <Code2 size={18} />
              </div>
              <div>
                <div className="integrations__card-title">Website Widget</div>
                <div className="integrations__card-sub">Embed the chat widget on any website</div>
              </div>
              <span className="badge badge--green">Active</span>
            </div>

            <p className="integrations__embed-desc">
              Copy and paste this code into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag.
            </p>

            <div className="integrations__code-block">
              <pre>{embedScript || '<!-- Save your widget config to generate the embed code -->'}</pre>
              <button
                onClick={() => copyToClipboard(embedScript)}
                className="integrations__copy-btn"
                title="Copy to clipboard"
                disabled={!embedScript}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>

            {widgetKey && (
              <div className="integrations__key-row">
                <span className="integrations__key-label">Widget Key</span>
                <code className="integrations__key-value">{widgetKey}</code>
                <button
                  className="db-btn db-btn--ghost integrations__key-copy"
                  onClick={() => copyToClipboard(widgetKey)}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            )}
          </div>

          {/* Placeholder cards for future integrations */}
          {[
            { icon: Globe, title: 'Slack', sub: 'Get ticket notifications in Slack', soon: true },
            { icon: Puzzle, title: 'Zapier', sub: 'Automate workflows with 5000+ apps', soon: true },
            { icon: Globe, title: 'Shopify', sub: 'Sync orders and customer data', soon: true },
          ].map(({ icon: Icon, title, sub, soon }) => (
            <div key={title} className="db-card integrations__card integrations__card--muted">
              <div className="integrations__card-header">
                <div className="integrations__card-icon integrations__card-icon--muted">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="integrations__card-title">{title}</div>
                  <div className="integrations__card-sub">{sub}</div>
                </div>
                {soon && <span className="badge badge--ghost">Soon</span>}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Integrations;
