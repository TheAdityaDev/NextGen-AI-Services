import { useState } from 'react';
import './Pricing.scss';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get started with NextGen AI Services at no cost',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Get Started',
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
    cta: 'Get Started',
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

const Pricing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="pricing" id="pricing">

      <div className="pricing__capsule-wrap">
        <span className="pricing__capsule">Pricing</span>
      </div>

      <h2 className="pricing__heading">
        Simple, <em className="pricing__heading-em">flexible</em> pricing
      </h2>
      <p className="pricing__subheading">No hidden fees. Cancel anytime.</p>

      <div className="pricing__toggle-wrap">
        <span className={`pricing__toggle-label${!yearly ? ' active' : ''}`}>Monthly</span>
        <button
          className={`pricing__toggle${yearly ? ' pricing__toggle--on' : ''}`}
          onClick={() => setYearly(v => !v)}
          aria-label="Toggle billing period"
        >
          <span className="pricing__toggle-thumb" />
        </button>
        <span className={`pricing__toggle-label${yearly ? ' active' : ''}`}>
          Yearly
          <span className="pricing__save-badge">Save 25%</span>
        </span>
      </div>

      <div className="pricing__cards">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div key={plan.id} className={`pricing__card${plan.popular ? ' pricing__card--popular' : ''}`}>

              {plan.popular && <div className="pricing__card-glow" />}

              <div className="pricing__card-header">
                <span className="pricing__plan-name">{plan.name}</span>
                {plan.popular && <span className="pricing__popular-badge">Popular</span>}
              </div>

              <div className="pricing__price-wrap">
                {price === 0 ? (
                  <span className="pricing__price-free">Free</span>
                ) : (
                  <>
                    <span className="pricing__price-dollar">$</span>
                    <span className="pricing__price-num">{price}</span>
                    <span className="pricing__price-period">/mo</span>
                  </>
                )}
              </div>

              <div className="pricing__divider" />

              <ul className="pricing__features">
                {plan.features.map((f) => (
                  <li key={f} className="pricing__feature">
                    <svg className="pricing__check" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="pricing__cta-wrap">
                <button className="pricing__cta">{plan.cta}</button>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};

export default Pricing; 