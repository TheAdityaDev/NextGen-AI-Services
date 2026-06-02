import { useState, useEffect } from 'react';
import './Dashboard.scss';
import Sidebar from './Sidebar';
import DashboardNav from './DashboardNav';
import DashboardHome from './pages/DashboardHome';
import Inbox from './pages/Inbox';
import Tickets from './pages/Tickets';
import Analytics from './pages/Analytics';
import AIConfig from './pages/AIConfig';
import AIInsights from './pages/AIInsights';
import ChatWidget from './pages/ChatWidget';
import TeamAgents from './pages/TeamAgents';
import Notifications from './pages/Notifications';
import CSAT from './pages/CSAT';
import Billing from './pages/Billing';
import OrgSettings from './pages/OrgSettings';
import MyProfile from './pages/MyProfile';
import Integrations from './pages/Integrations';
import { useAuth } from '../../contexts/AuthContext';

const PAGES = {
  dashboard:    DashboardHome,
  inbox:        Inbox,
  tickets:      Tickets,
  analytics:    Analytics,
  aiconfig:     AIConfig,
  aiinsights:   AIInsights,
  chatwidget:   ChatWidget,
  integrations: Integrations,
  teamagents:   TeamAgents,
  notifications: Notifications,
  csat:         CSAT,
  billing:      Billing,
  orgsettings:  OrgSettings,
  myprofile:    MyProfile,
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAgent = user?.role === 'support_agent';

  const [activePage, setActivePage] = useState(
    // Agents default to inbox; admins default to dashboard
    isAgent ? 'inbox' : 'dashboard'
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [inboxCustomerId, setInboxCustomerId] = useState(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Start with sidebar closed on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle page change - close sidebar on mobile
  const handlePageChange = (page) => {
    setActivePage(page);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle navigation from tickets to inbox
  const handleNavigateToInbox = (customerId) => {
    setInboxCustomerId(customerId);
    setActivePage('inbox');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle backdrop click - close sidebar on mobile
  const handleBackdropClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const renderPageComponent = () => {
    switch (activePage) {
      case 'tickets':
        return <Tickets onNavigateToInbox={handleNavigateToInbox} />;
      case 'inbox':
        return <Inbox initialCustomerId={inboxCustomerId} />;
      default:
        const PageComponent = PAGES[activePage] || DashboardHome;
        return <PageComponent />;
    }
  };

  return (
    <div className={`db ${sidebarOpen ? 'db--sidebar-open' : 'db--sidebar-closed'}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      {isMobile && <div className="db__backdrop" onClick={handleBackdropClick} />}
      <div className="db__main">
        <DashboardNav
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="db__content">
          {renderPageComponent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;