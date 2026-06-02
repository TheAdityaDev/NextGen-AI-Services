import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.scss";

const ChatFrameLogo = () => (
  <svg
    className="logo__icon"
    width="26" height="28"
    viewBox="0 0 66 70"
    fill="none"
  >
    <path d="M65.9985 32.8161C65.9985 32.3636 65.6279 31.9969 65.1707 31.9969H47.1483C46.6913 31.9969 46.3208 31.6301 46.3208 31.1776V13.4764C46.3208 13.024 45.9502 12.6572 45.493 12.6572H28.2905C27.8336 12.6572 27.4648 13.025 27.4456 13.4771C27.0232 23.5088 18.8864 31.5619 8.75026 31.9799C8.29353 31.9986 7.92188 32.3636 7.92188 32.8161V49.841C7.92188 50.2935 8.29247 50.6602 8.7496 50.6602H26.6352C27.0924 50.6602 27.463 51.027 27.463 51.4795V69.1806C27.463 69.6331 27.8336 69.9998 28.2905 69.9998H45.493C45.9502 69.9998 46.3187 69.6321 46.3382 69.1801C46.7671 59.1482 55.0272 51.095 65.1699 50.6772C65.6269 50.6585 65.9985 50.2935 65.9985 49.841V32.8161Z" fill="white" fillOpacity="0.2"/>
    <path d="M58.0765 20.1588C58.0765 19.7064 57.7059 19.3396 57.2487 19.3396H39.2266C38.7694 19.3396 38.3988 18.9728 38.3988 18.5204V0.819179C38.3988 0.36676 38.0282 0 37.571 0H20.3687C19.9116 0 19.5428 0.36781 19.5238 0.819839C19.1015 10.8515 10.9646 18.9046 0.828378 19.3226C0.371641 19.3414 0 19.7064 0 20.1588V37.1837C0 37.6362 0.37058 38.003 0.827711 38.003H18.7133C19.1704 38.003 19.541 38.3697 19.541 38.8222V56.5234C19.541 56.9759 19.9116 57.3426 20.3687 57.3426H37.571C38.0282 57.3426 38.397 56.9748 38.4162 56.5229C38.8451 46.4909 47.1052 38.4377 57.2482 38.02C57.7049 38.0012 58.0765 37.6362 58.0765 37.1837V20.1588Z" fill="white"/>
  </svg>
);

const Navbar = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Don't render auth buttons while loading
  const renderAuthActions = () => {
    if (loading) {
      return null;
    }

    if (isAuthenticated()) {
      // Show role-based navigation for authenticated users
      const userRole = user?.role;
      
      if (userRole === 'company_admin') {
        return (
          <div className="navbar__actions">
            <Link to="/dashboard" className="navbar__btn navbar__btn--dashboard">
              <span className="navbar__btn-inner">
                <span className="navbar__btn-top">Dashboard</span>
                <span className="navbar__btn-bottom">Dashboard</span>
              </span>
            </Link>
          </div>
        );
      } else if (userRole === 'support_agent') {
        return (
          <div className="navbar__actions">
            <Link to="/workspace" className="navbar__btn navbar__btn--workspace">
              <span className="navbar__btn-inner">
                <span className="navbar__btn-top">Workspace</span>
                <span className="navbar__btn-bottom">Workspace</span>
              </span>
            </Link>
          </div>
        );
      }
    }

    // Show login/signup for non-authenticated users
    return (
      <div className="navbar__actions">
        <Link to="/login" className="navbar__btn navbar__btn--login">
          <span className="navbar__btn-inner">
            <span className="navbar__btn-top">Login</span>
            <span className="navbar__btn-bottom">Login</span>
          </span>
        </Link>
        <Link to="/onboarding" className="navbar__btn navbar__btn--signup">
          <span className="navbar__btn-inner">
            <span className="navbar__btn-top">Sign Up</span>
            <span className="navbar__btn-bottom">Sign Up</span>
          </span>
        </Link>
      </div>
    );
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <a href="#" className="navbar__logo">
        <ChatFrameLogo />
        <div className="navbar__wordmark">
          <span className="navbar__chat">NextGen</span>
          <span className="navbar__frame"> AI Services</span>
        </div>
      </a>

      {/* Nav Links */}
      <ul className="navbar__links">
        <li><a href="#how-it-works">How it Works</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>

      {/* Auth-aware Actions */}
      {renderAuthActions()}
    </nav>
  );
};

export default Navbar;
