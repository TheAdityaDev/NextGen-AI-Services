import { useState, useEffect, useRef } from 'react';
import './TheWorkspace.scss';
import agentWork from '../../assets/agent-work.png';
import agentSkeleton from '../../assets/agent-skeleton.svg';

const ROLES = [
  {
    word: 'owners',
    desc: 'Analytics dashboard, CSAT scores, volume handled by AI vs agents, and operational cost saved.',
  },
  {
    word: 'agents',
    desc: 'The support inbox, AI-suggested replies, and ticket context panels built for faster resolutions.',
  },
  {
    word: 'developers',
    desc: 'Integration docs, webhook configuration, API key management, and embeddable support widgets.',
  },
];

const TYPING_SPEED  = 68;
const ERASING_SPEED = 34;
const HOLD          = 2800;
const PAUSE         = 360;

const useTypewriter = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase]         = useState('typing');
  const t = useRef(null);

  useEffect(() => {
    const word = ROLES[roleIndex].word;
    clearTimeout(t.current);

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        t.current = setTimeout(() =>
          setDisplayed(word.slice(0, displayed.length + 1)), TYPING_SPEED);
      } else {
        t.current = setTimeout(() => setPhase('holding'), HOLD);
      }
    } else if (phase === 'holding') {
      t.current = setTimeout(() => setPhase('erasing'), 0);
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        t.current = setTimeout(() =>
          setDisplayed(displayed.slice(0, -1)), ERASING_SPEED);
      } else {
        t.current = setTimeout(() => {
          setRoleIndex(i => (i + 1) % ROLES.length);
          setPhase('typing');
        }, PAUSE);
      }
    }

    return () => clearTimeout(t.current);
  }, [phase, displayed, roleIndex]);

  const showCursor = phase === 'typing' || phase === 'erasing';
  return { displayed, roleIndex, showCursor };
};

// ── X-ray scanner overlay ─────────────────────────────
const XRayScanner = () => (
  <div className="xray" aria-hidden="true">

    {/* Base agent image */}
    <img
      src={agentWork}
      alt=""
      className="xray__base"
      draggable="false"
    />

    {/* Skeleton SVG — revealed by clip-path that follows scan line */}
    <div className="xray__skeleton-wrap">
      <img
        src={agentSkeleton}
        alt=""
        className="xray__skeleton"
        draggable="false"
      />
    </div>

    {/* The scan line itself */}
    <div className="xray__line">
      {/* Glow head of the line */}
      <div className="xray__line-glow" />
    </div>

    <svg
  className="xray__dashes"
  viewBox="0 0 220 400"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>

</svg>

  </div>
);

// ── Main component ────────────────────────────────────
const TheWorkspace = () => {
  const { displayed, roleIndex, showCursor } = useTypewriter();
  const [activeDesc, setActiveDesc] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setActiveDesc(roleIndex), 200);
    return () => clearTimeout(timer);
  }, [roleIndex]);

  return (
    <section className="workspace">
      <div className="workspace__panel">

        {/* Capsule — top left */}
        <div className="workspace__capsule">
          The Workspace
        </div>

        {/* X-ray scanner — replaces plain image */}
        <div className="workspace__img-wrap">
          <XRayScanner />
        </div>

        {/* Heading */}
        <div className="workspace__heading">
          <div className="workspace__heading-line">
            <span className="workspace__heading-static">Built for&nbsp;</span>
            <span className="workspace__tw-word">{displayed}</span>
            <span className={`workspace__tw-cursor${showCursor ? '' : ' workspace__tw-cursor--off'}`}>
              |
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="workspace__description">
          <div className="workspace__desc-wrap">
            {ROLES.map((r, i) => (
              <p
                key={r.word}
                className={`workspace__desc${i === activeDesc ? ' workspace__desc--active' : ''}`}
              >
                {r.desc}
              </p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TheWorkspace;