import { useState } from 'react';
import './AIConfig.scss';

const Toggle = ({ label, defaultOn = false }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="aiconfig__toggle-row">
      <div>
        <div className="aiconfig__toggle-label">{label}</div>
      </div>
      <label className="db-toggle">
        <input type="checkbox" checked={on} onChange={() => setOn(o => !o)} />
        <div className="db-toggle__track"><div className="db-toggle__thumb" /></div>
      </label>
    </div>
  );
};

const AIConfig = () => {
  const [confidence, setConfidence] = useState(75);
  const [tone, setTone] = useState('professional');
  const [maxLen, setMaxLen] = useState(300);
  const [prompt, setPrompt] = useState('You are a friendly and professional support assistant for NextGen AI Services. Always be concise, helpful, and empathetic.');

  return (
    <div className="db-page aiconfig">
      <div className="db-page__header">
        <h1 className="db-page__title">AI Config</h1>
        <p className="db-page__sub">Control how the AI behaves across your support channels.</p>
      </div>

      <div className="two-col">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="db-card">
            <div className="aiconfig__section-title">Toggles</div>
            <Toggle label="AI Enabled"               defaultOn={true} />
            <Toggle label="Auto Escalation"          defaultOn={true} />
            <Toggle label="Suggested Replies"        defaultOn={true} />
            <Toggle label="AI Typing Indicator"      defaultOn={false} />
            <Toggle label="Out-of-hours AI mode"     defaultOn={false} />
          </div>

          <div className="db-card">
            <div className="aiconfig__section-title">Response Settings</div>
            <div className="aiconfig__field">
              <label>Confidence Threshold — <strong>{confidence}%</strong></label>
              <input
                type="range" min={40} max={100} value={confidence}
                className="aiconfig__slider"
                onChange={e => setConfidence(e.target.value)}
              />
              <div className="aiconfig__slider-labels">
                <span>More answers</span><span>More accurate</span>
              </div>
            </div>
            <div className="aiconfig__field">
              <label>Response Tone</label>
              <select className="db-input aiconfig__select" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div className="aiconfig__field">
              <label>Max Response Length — <strong>{maxLen} chars</strong></label>
              <input type="range" min={100} max={800} value={maxLen}
                className="aiconfig__slider"
                onChange={e => setMaxLen(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="db-card aiconfig__prompt-card">
          <div className="aiconfig__section-title">System Prompt</div>
          <p className="aiconfig__prompt-hint">
            This is the instruction your AI follows for every response. Be specific about tone, limits, and context.
          </p>
          <textarea
            className="aiconfig__prompt-area"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={10}
          />
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
            <button className="db-btn db-btn--primary">Save Prompt</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;