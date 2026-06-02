import { useState } from 'react';
import './FAQ.scss';

const FAQS = [
  {
    q: 'What is NextGen AI Services?',
    a: 'NextGen AI Services is an AI-powered customer support platform that combines intelligent automation with real human support. Businesses can manage tickets, live chats, AI responses, analytics, and team workflows from one unified workspace.',
  },
  {
    q: 'How does NextGen AI Services AI work?',
    a: 'NextGen AI Services AI uses company-specific FAQs and support context to generate intelligent customer responses. Every reply is assigned a confidence score, and low-confidence queries are automatically escalated to human agents.',
  },
  {
    q: 'Can NextGen AI Services replace human support agents?',
    a: 'No. NextGen AI Services is designed to assist support teams, not replace them. AI handles repetitive queries while human agents focus on complex customer issues and real-time conversations.',
  },
  {
    q: 'What happens when AI cannot solve a query?',
    a: 'If the AI confidence score drops below a configured threshold, the ticket is escalated instantly to a human agent along with the complete conversation history and AI-generated suggestions.',
  },
  {
    q: 'Can businesses customize AI responses?',
    a: 'Yes. Companies can upload FAQs, knowledge base content, support categories, and branding information to make AI responses company-specific instead of generic.',
  },
  {
    q: 'What roles are available inside NextGen AI Services?',
    a: 'NextGen AI Services currently supports three roles: Company Owners / Admins, Support Agents, and Customers. Each role receives a different dashboard experience and permission system tailored to their workflow.',
  },
  {
    q: 'Does NextGen AI Services provide analytics?',
    a: 'Yes. NextGen AI Services includes analytics for ticket volume, AI resolution rate, escalation tracking, CSAT scores, response times, and operational insights — all from one dashboard.',
  },
  {
    q: 'Can NextGen AI Services be embedded into websites?',
    a: 'Yes. Businesses can integrate NextGen AI Services into their websites using an embeddable support widget with customizable branding, colors, welcome messages, and AI-powered conversations.',
  },
  {
    q: 'Does NextGen AI Services support AI-assisted replies for agents?',
    a: 'Yes. Human agents receive AI-generated suggested replies and conversation summaries directly inside the support inbox to speed up resolutions and reduce manual effort.',
  },
  {
    q: 'Is NextGen AI Services secure?',
    a: 'Yes. NextGen AI Services uses JWT authentication, bcrypt password hashing, role-based access control, and tenant-level data isolation to protect all customer and company data.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i) => {
    setOpenIndex(prev => prev === i ? null : i);
  };

  return (
    <section className="faq" id="faq">
      <div className="faq__label-top">
        <span>Everything explained</span>
      </div>
      <div className="faq__inner">

        <div className="faq__header">
          <h2 className="faq__title">
            Frequently asked <em className="faq__title-em">questions</em>
          </h2>
          <p className="faq__sub">
            Everything you need to know about NextGen AI Services.<br />
            Can't find an answer? <a href="/contact">Talk to our team.</a>
          </p>
        </div>

        <div className="faq__list">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}
              >
                <button
                  className="faq__question"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className="faq__question-text">{item.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    {isOpen ? (
                      /* minus */
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="1"/>
                        <path d="M5.5 9h7" stroke="currentColor" strokeWidth="1.4"
                          strokeLinecap="round"/>
                      </svg>
                    ) : (
                      /* plus */
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8.5" stroke="currentColor" strokeWidth="1"/>
                        <path d="M9 5.5v7M5.5 9h7" stroke="currentColor" strokeWidth="1.4"
                          strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
                </button>

                <div className="faq__answer-wrap">
                  <div className="faq__answer">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;