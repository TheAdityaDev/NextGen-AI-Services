import { useState } from 'react';
import './KnowledgeBase.scss';

const FAQS = [
  { q:'What is your refund policy?',    a:'We offer full refunds within 30 days.',  cat:'Billing',  used:82 },
  { q:'How do I track my order?',       a:'Use the tracking link sent via email.',   cat:'Shipping', used:61 },
  { q:'Can I change my delivery address?', a:'Contact us within 2 hours of placing order.', cat:'Orders', used:44 },
];

const KnowledgeBase = () => {
  const [search, setSearch] = useState('');
  const filtered = FAQS.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="db-page kb">
      <div className="db-page__header">
        <h1 className="db-page__title">Knowledge Base</h1>
        <p className="db-page__sub">Train your AI with company-specific content.</p>
      </div>
      <div className="kb__toolbar">
        <input className="db-input kb__search" placeholder="Search FAQs…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="db-btn db-btn--primary">+ Add FAQ</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((f, i) => (
          <div key={i} className="db-card kb__item">
            <div className="kb__item-header">
              <span className="kb__item-q">{f.q}</span>
              <span className={`badge badge--ghost`}>{f.cat}</span>
            </div>
            <p className="kb__item-a">{f.a}</p>
            <div className="kb__item-footer">
              <span className="kb__item-used">Used in <strong>{f.used}</strong> AI responses this week</span>
              <div style={{ display:'flex', gap:8 }}>
                <button className="db-btn db-btn--ghost" style={{ padding:'5px 12px', fontSize:12 }}>Edit</button>
                <button className="db-btn db-btn--danger" style={{ padding:'5px 12px', fontSize:12 }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default KnowledgeBase;