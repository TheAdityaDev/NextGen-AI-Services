import { useState } from 'react';
import './Billing.scss';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get started with NextGen AI Services at no cost',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Current Plan',
    current: true,
    features: [
      '500 AI responses per month',
      '1 workspace',
      'Basic analytics',
      'Email support',
      'Chat widget customization',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Unlock powerful AI support features',
    monthlyPrice: 29,
    yearlyPrice: 22,
    popular: true,
    cta: 'Coming Soon',
    features: [
      'Unlimited AI responses',
      '5 workspaces',
      'Advanced analytics & CSAT',
      'Priority support',
      'Custom AI training',
      'Webhook integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full control for large-scale teams',
    monthlyPrice: 99,
    yearlyPrice: 79,
    cta: 'Contact Sales',
    features: [
      'Everything in Pro',
      'Unlimited workspaces',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom contracts',
      'On-premise deployment',
    ],
  },
];

const Billing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="db-page billing">
      <div className="db-page__header">
        <h1 className="db-page__title">Billing & Plans</h1>
        <p className="db-page__sub">You're on the free Starter plan. Paid plans are coming soon.</p>
      </div>

      {/* Toggle */}
      <div className="billing__toggle-wrap">
        <span className={`billing__toggle-label${!yearly ? ' active' : ''}`}>Monthly</span>
        <button
          className={`billing__toggle${yearly ? ' billing__toggle--on' : ''}`}
          onClick={() => setYearly(v => !v)}
        >
          <span className="billing__toggle-thumb" />
        </button>
        <span className={`billing__toggle-label${yearly ? ' active' : ''}`}>
          Yearly
          <span className="billing__save-badge">Save 25%</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="billing__cards">
        {PLANS.map(plan => {
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`billing__card${plan.popular ? ' billing__card--popular' : ''}${plan.current ? ' billing__card--current' : ''}`}
            >
              {plan.popular && <div className="billing__card-glow" />}

              <div className="billing__card-header">
                <span className="billing__plan-name">{plan.name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {plan.current  && <span className="badge badge--green">Current</span>}
                  {plan.popular  && <span className="badge badge--ghost">Popular</span>}
                </div>
              </div>

              <p className="billing__plan-tagline">{plan.tagline}</p>

              <div className="billing__price-wrap">
                {price === 0 ? (
                  <span className="billing__price-free">Free</span>
                ) : (
                  <>
                    <span className="billing__price-dollar">$</span>
                    <span className="billing__price-num">{price}</span>
                    <span className="billing__price-period">/mo</span>
                  </>
                )}
              </div>

              <div className="billing__divider" />

              <ul className="billing__features">
                {plan.features.map(f => (
                  <li key={f} className="billing__feature">
                    <svg className="billing__check" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`billing__cta${plan.current ? ' billing__cta--current' : ''}`}
                disabled={plan.current || plan.id === 'pro'}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Billing;
