import './DashboardNav.scss';
import { Menu, X, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  inbox:        'Inbox',
  tickets:      'Tickets',
  analytics:    'Analytics',
  aiconfig:     'AI Config',
  knowledgebase:'Knowledge Base',
  aiinsights:   'AI Insights',
  chatwidget:   'Chat Widget',
  integrations: 'Integrations',
  teamagents:   'Team & Agents',
  notifications:'Notifications',
  csat:         'CSAT / Feedback',
  billing:      'Billing',
  orgsettings:  'Organization Settings',
  myprofile:    'My Profile',
};

const DashboardNav = ({ activePage, sidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      navigate('/');
    }
  };

  return (
    <header className="db-nav">
      <div className="db-nav__left">
        <button
          className="db-nav__collapse"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
        <div className="db-nav__breadcrumb">
          <span className="db-nav__bc-org">NextGen AI Services</span>
          <span className="db-nav__bc-sep">/</span>
          <span className="db-nav__bc-page">{PAGE_TITLES[activePage]}</span>
        </div>
      </div>

      <div className="db-nav__right">
        <div className="db-nav__search">
          <Search size={13} />
          <input placeholder="Search…" />
          <span className="db-nav__search-kbd">⌘K</span>
        </div>
        <span className="db-nav__logout" onClick={handleLogout}>
          Logout
        </span>
      </div>
    </header>
  );
};

export default DashboardNav;