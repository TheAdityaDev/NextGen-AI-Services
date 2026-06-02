import './Footer.scss';
import agentWork from '../assets/agent-work.png';

const Footer = () => {
  return (
    <footer className="footer">
      
      {/* Background agent image */}
      <div className="footer__bg-image">
        <img 
          src={agentWork} 
          alt="" 
          className="footer__agent-img"
          draggable="false"
        />
      </div>

      <div className="footer__content">
        
        {/* Main headline */}
        <div className="footer__headline-wrap">
          <h2 className="footer__headline">
            Transform your support —{' '}
            <span className="footer__headline-em">automatically</span>.
          </h2>
        </div>

        {/* Navigation links */}
        <nav className="footer__nav">
          <a href="/" className="footer__nav-link">Home</a>
          <a href="#how-it-works" className="footer__nav-link">How it Works</a>
          <a href="#pricing" className="footer__nav-link">Pricing</a>
          <a href="#faq" className="footer__nav-link">FAQ</a>
          <a href="#support" className="footer__nav-link">Support</a>
          <a href="/signup" className="footer__nav-link footer__nav-link--cta">Get Started</a>
        </nav>

        {/* Legal links */}
        <div className="footer__legal">
          <a href="/terms" className="footer__legal-link">Terms & Conditions</a>
          <a href="/privacy" className="footer__legal-link">Privacy Policy</a>
          
          {/* Social icons */}
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom branding */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          © 2024 NextGen AI Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;