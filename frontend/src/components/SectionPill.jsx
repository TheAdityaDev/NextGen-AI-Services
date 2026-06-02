import './SectionPill.scss';

export function SectionPill({ label }) {
  return (
    <div className="section-pill">
      <span>{label}</span>
    </div>
  );
}
