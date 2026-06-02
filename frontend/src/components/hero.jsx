import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./hero.scss";
import heroBaseLayer from "../assets/hero-base-layer.svg";
import heroAgent from "../assets/hero-agent.png";

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 7h8M8 4l3 3-3 3"
      stroke="#0F0F0F"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="rgba(250,250,250,0.4)" strokeWidth="1.2" />
    <path d="M6 5l3 2-3 2V5z" fill="rgba(250,250,250,0.55)" />
  </svg>
);

// Parses "10x" → { value: 10, suffix: "x" }
// "98%" → { value: 98, suffix: "%" }
// "40+" → { value: 40, suffix: "+" }
const parseStat = (str) => {
  const match = str.match(/^(\d+)(.*)$/);
  return match ? { value: parseInt(match[1], 10), suffix: match[2] } : { value: 0, suffix: str };
};

const AnimatedStat = ({ num, delay = 0 }) => {
  const { value, suffix } = parseStat(num);
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const startTime = performance.now();
          const tick = (now) => {
            const elapsed = now - startTime - delay * 1000;
            if (elapsed < 0) { requestAnimationFrame(tick); return; }
            const progress = Math.min(elapsed / duration, 1);
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, delay]);

  return <span ref={ref} className="hero__stat-num">{display}{suffix}</span>;
};

const STATS = [
  { num: "10x", label: "Faster resolution" },
  { num: "98%", label: "CSAT score" },
  { num: "40+", label: "Integrations" },
];

const Hero = () => {
  const navigate = useNavigate();

  const handleStartFree = (e) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  const handleSeeHowItWorks = (e) => {
    e.preventDefault();
    // Open the NextGen AI Services widget
    if (window.NextGenAI) {
      window.NextGenAI.open();
    } else if (window.ChatFrame) {
      window.ChatFrame.open();
    }
  };

  return (
    <section className="hero">
      <div className="hero__left">
        <div className="hero__content">
          <h1 className="hero__headline">
            Support that
            <br />
            <em>thinks</em> before
            <br />
            you do
          </h1>

          <p className="hero__sub">
            NextGen AI Services brings AI to every customer conversation — resolving
            issues faster, learning your product, and freeing your team to
            focus on what matters.
          </p>

          <div className="hero__ctas">
            <a href="#" className="hero__cta hero__cta--primary" onClick={handleStartFree}>
              Start for free
              <span className="hero__cta-arrow">
                <span className="hero__cta-arrow-default"><ArrowIcon /></span>
                <span className="hero__cta-arrow-hover"><ArrowIcon /></span>
              </span>
            </a>
            <a href="#" className="hero__cta hero__cta--secondary" onClick={handleSeeHowItWorks}>
              See how it works
              <PlayIcon />
            </a>
          </div>

          <div className="hero__stats">
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.num}>
                {i !== 0 && <div className="hero__stat-divider" />}
                <div className="hero__stat">
                  <AnimatedStat num={stat.num} delay={0.54 + i * 0.1} />
                  <span className="hero__stat-label">{stat.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Right visual — desktop only */}
      <div className="hero__right">
        <img
          src={heroBaseLayer}
          alt=""
          className="hero__visual"
          aria-hidden="true"
        />
        <img
          src={heroAgent}
          alt=""
          className="hero__agent"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default Hero;