import { Star } from 'lucide-react';
import './CSAT.scss';

const CSAT = () => (
  <div className="db-page csat">
    <div className="db-page__header">
      <h1 className="db-page__title">CSAT / Feedback</h1>
      <p className="db-page__sub">Customer satisfaction tracking and feedback management.</p>
    </div>

    <div className="csat__coming-soon">
      <div className="csat__coming-soon-icon">
        <Star size={32} strokeWidth={1.2} />
      </div>
      <h2 className="csat__coming-soon-title">Coming Soon</h2>
      <p className="csat__coming-soon-text">
        We're building a full CSAT and feedback system — automated post-conversation surveys,
        rating trends, and sentiment analysis. It'll be ready shortly.
      </p>
      <span className="badge badge--yellow">In development</span>
    </div>
  </div>
);

export default CSAT;
