import './Sidebar.scss';
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  BarChart3,
  Bot,
  Lightbulb,
  MessageSquare,
  Puzzle,
  Users,
  Star,
  CreditCard,
  Settings,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
      { id: 'inbox',        label: 'Inbox',         icon: Inbox },
      { id: 'tickets',      label: 'Tickets',       icon: Ticket },
      { id: 'analytics',    label: 'Analytics',     icon: BarChart3 },
    ],
  },
  {
    group: 'AI & CHANNELS',
    items: [
      { id: 'aiconfig',      label: 'AI Config',       icon: Bot },
      { id: 'aiinsights',    label: 'AI Insights',     icon: Lightbulb },
      { id: 'chatwidget',    label: 'Chat Widget',     icon: MessageSquare },
      { id: 'integrations',  label: 'Integrations',    icon: Puzzle },
    ],
  },
  {
    group: 'TEAM',
    items: [
      { id: 'teamagents',   label: 'Team & Agents',   icon: Users },
      { id: 'csat',         label: 'CSAT / Feedback', icon: Star },
    ],
  },
  {
    group: 'SETTINGS',
    items: [
      { id: 'billing',     label: 'Billing',              icon: CreditCard },
      { id: 'orgsettings', label: 'Organization Settings', icon: Settings },
      { id: 'myprofile',   label: 'My Profile',           icon: User },
    ],
  },
];

// Pages visible to all roles
const AGENT_ALLOWED = new Set(['inbox', 'tickets', 'myprofile']);

const Sidebar = ({ activePage, setActivePage, open, setOpen }) => {
  const { getFullName, user } = useAuth();
  const isAgent = user?.role === 'support_agent';
  const fullName = getFullName() || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleLabel = user?.role === 'company_admin' ? 'Owner' : user?.role === 'support_agent' ? 'Agent' : 'Member';

  // Filter nav sections based on role
  const visibleNav = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => !isAgent || AGENT_ALLOWED.has(item.id)),
  })).filter(section => section.items.length > 0);
  const handleSidebarClick = (e) => {
    if (!open && window.innerWidth > 768) {
      if (!e.target.closest('.sidebar__item')) {
        setOpen(true);
      }
    }
  };

  return (
    <aside 
      className={`sidebar ${open ? 'sidebar--open' : 'sidebar--closed'}`}
      onClick={handleSidebarClick}
    >
      {/* Logo */}
      <div className="sidebar__logo">
        <svg className="sidebar__logo-icon" width="22" height="24" viewBox="0 0 66 70" fill="none">
          <path d="M65.9985 32.8161C65.9985 32.3636 65.6279 31.9969 65.1707 31.9969H47.1483C46.6913 31.9969 46.3208 31.6301 46.3208 31.1776V13.4764C46.3208 13.024 45.9502 12.6572 45.493 12.6572H28.2905C27.8336 12.6572 27.4648 13.025 27.4456 13.4771C27.0232 23.5088 18.8864 31.5619 8.75026 31.9799C8.29353 31.9986 7.92188 32.3636 7.92188 32.8161V49.841C7.92188 50.2935 8.29247 50.6602 8.7496 50.6602H26.6352C27.0924 50.6602 27.463 51.027 27.463 51.4795V69.1806C27.463 69.6331 27.8336 69.9998 28.2905 69.9998H45.493C45.9502 69.9998 46.3187 69.6321 46.3382 69.1801C46.7671 59.1482 55.0272 51.095 65.1699 50.6772C65.6269 50.6585 65.9985 50.2935 65.9985 49.841V32.8161Z" fill="white" fillOpacity="0.2"/>
          <path d="M58.0765 20.1588C58.0765 19.7064 57.7059 19.3396 57.2487 19.3396H39.2266C38.7694 19.3396 38.3988 18.9728 38.3988 18.5204V0.819179C38.3988 0.36676 38.0282 0 37.571 0H20.3687C19.9116 0 19.5428 0.36781 19.5238 0.819839C19.1015 10.8515 10.9646 18.9046 0.828378 19.3226C0.371641 19.3414 0 19.7064 0 20.1588V37.1837C0 37.6362 0.37058 38.003 0.827711 38.003H18.7133C19.1704 38.003 19.541 38.3697 19.541 38.8222V56.5234C19.541 56.9759 19.9116 57.3426 20.3687 57.3426H37.571C38.0282 57.3426 38.397 56.9748 38.4162 56.5229C38.8451 46.4909 47.1052 38.4377 57.2482 38.02C57.7049 38.0012 58.0765 37.6362 58.0765 37.1837V20.1588Z" fill="white"/>
        </svg>
        {open && (
          <span className="sidebar__logo-name">
            <span className="sidebar__logo-chat">NextGen</span>
            <span className="sidebar__logo-frame">AI Services</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {visibleNav.map(section => (
          <div key={section.group} className="sidebar__group">
            {open && (
              <span className="sidebar__group-label">{section.group}</span>
            )}
            {section.items.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar__item ${activePage === item.id ? 'sidebar__item--active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  title={!open ? item.label : undefined}
                >
                  <IconComponent className="sidebar__item-icon" size={16} />
                  {open && (
                    <span className="sidebar__item-label">{item.label}</span>
                  )}
                  {open && item.badge && (
                    <span className="sidebar__item-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {open && (
        <div className="sidebar__footer">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user">
            <span className="sidebar__user-name">{fullName}</span>
            <span className="sidebar__user-role">{roleLabel}</span>
          </div>
          <div className="sidebar__status">
            <span className="sidebar__status-dot" />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;