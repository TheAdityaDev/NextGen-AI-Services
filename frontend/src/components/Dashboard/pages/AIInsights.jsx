import './AIInsights.scss';

const METRICS = [
  { label:'Total AI Replies',      value:'2,841', color:'blue' },
  { label:'Avg Confidence',        value:'81%',   color:'green' },
  { label:'Hallucination Flags',   value:'3',     color:'red' },
  { label:'Escalated Queries',     value:'42',    color:'yellow' },
];

const TOP_QUERIES = [
  { q:'Where is my order?',    count:284 },
  { q:'Refund policy',         count:198 },
  { q:'Cancel subscription',   count:121 },
  { q:'Account access issue',  count:89 },
];

const SUGGESTIONS = [
  'Add a detailed refund FAQ — 198 queries this week.',
  'Create a "How to cancel" article to reduce agent load.',
  'Your AI confidence drops on billing queries — add more billing docs.',
];

const AIInsights = () => (
  <div className="db-page">
    <div className="db-page__header">
      <h1 className="db-page__title">AI Insights</h1>
      <p className="db-page__sub">How your AI is performing across all conversations.</p>
    </div>
    <div className="stats-grid">
      {METRICS.map(m => (
        <div key={m.label} className="stat-card">
          <div className="stat-card__label">{m.label}</div>
          <div className="stat-card__value">{m.value}</div>
        </div>
      ))}
    </div>
    <div className="two-col">
      <div className="db-card">
        <div style={{ fontWeight:600, fontSize:13, marginBottom:16 }}>Top Queries</div>
        {TOP_QUERIES.map((q, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:'var(--text)', marginBottom:4 }}>{q.q}</div>
              <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${(q.count/284)*100}%`, height:'100%', background:'rgba(120,180,255,0.5)', borderRadius:3 }} />
              </div>
            </div>
            <span style={{ fontSize:12, color:'var(--text-2)', flexShrink:0 }}>{q.count}</span>
          </div>
        ))}
      </div>
      <div className="db-card" style={{ background:'rgba(160,255,180,0.03)', borderColor:'rgba(160,255,180,0.1)' }}>
        <div style={{ fontWeight:600, fontSize:13, color:'var(--green)', marginBottom:16 }}>
          AI Learning Suggestions
        </div>
        {SUGGESTIONS.map((s, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ color:'var(--green)', flexShrink:0 }}>→</span>
            <span style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AIInsights;