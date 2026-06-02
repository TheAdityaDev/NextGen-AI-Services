import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './Tickets.scss';
import apiService from '../../../services/api';
import socketService from '../../../services/socket';
import { useAuth } from '../../../contexts/AuthContext';

const STATUS_COLOR = { open:'green', escalated:'red', resolved:'blue', closed:'ghost' };
const PRI_COLOR    = { urgent:'red', high:'yellow', medium:'blue', low:'ghost' };

const FILTERS = ['All', 'Open', 'Escalated', 'Resolved', 'Closed'];

const Tickets = ({ onNavigateToInbox }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    customerName: '',
    customerEmail: '',
    subject: '',
    description: '',
    priority: 'medium' // Changed from 'normal' to 'medium' to match backend
  });

  useEffect(() => {
    // Load tickets from API immediately
    loadTickets();
    
    // Connect socket for real-time updates
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for ticket updates
    const handleTicketUpdate = (updatedTicket) => {
      setTickets(prev => prev.map(t => 
        t._id === updatedTicket._id ? updatedTicket : t
      ));
    };

    socketService.on('ticket:updated', handleTicketUpdate);

    return () => {
      socketService.off('ticket:updated', handleTicketUpdate);
    };
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = filter !== 'All' ? { status: filter.toLowerCase() } : {};
      const response = await apiService.getTickets(filters);
      
      if (response.success && response.data && Array.isArray(response.data.tickets)) {
        setTickets(response.data.tickets);
      } else {
        console.warn('Invalid tickets response:', response);
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setError(error.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload tickets when filter changes
  useEffect(() => {
    if (!loading) {
      loadTickets();
    }
  }, [filter]);

  const filtered = filter === 'All'
    ? (tickets || [])
    : (tickets || []).filter(t => t.status === filter.toLowerCase());

  const handleTicketClick = (ticket) => {
    console.log('Ticket clicked:', ticket); // Debug log
    
    // If ticket is already assigned to someone, go directly to inbox
    if (ticket.assignedTo || (ticket.assignedAgent && ticket.assignedAgent !== 'Unassigned')) {
      onNavigateToInbox && onNavigateToInbox(ticket._id);
      return;
    }

    // If unassigned, show assignment modal
    setSelectedTicket(ticket);
    setShowAssignModal(true);
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket) return;

    console.log('Assigning ticket:', selectedTicket._id, 'to user:', user?._id);

    try {
      const response = await apiService.updateTicket(selectedTicket._id, {
        assignedTo: user?._id, // Use actual user ID
        status: 'in_progress' // Change status to in_progress when assigned
      });

      console.log('Assignment response:', response);

      if (response.success) {
        // Update local state with the actual response data
        setTickets(prev => prev.map(t => 
          t._id === selectedTicket._id 
            ? { ...t, ...response.data.ticket } 
            : t
        ));

        // Close modal and navigate to inbox
        setShowAssignModal(false);
        onNavigateToInbox && onNavigateToInbox(selectedTicket._id);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      // Still navigate on error for better UX
      setShowAssignModal(false);
      onNavigateToInbox && onNavigateToInbox(selectedTicket._id);
      setSelectedTicket(null);
    }
  };

  const handleCancelAssignment = () => {
    setShowAssignModal(false);
    setSelectedTicket(null);
  };

  const handleNewTicketClick = () => {
    setShowNewTicketModal(true);
  };

  const handleNewTicketChange = (e) => {
    const { name, value } = e.target;
    setNewTicketData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreatingTicket(true);

    const ticketData = {
      title: newTicketData.subject || 'Test Ticket', // Ensure title is not empty
      description: newTicketData.description || 'Test description',
      priority: newTicketData.priority === 'normal' ? 'medium' : newTicketData.priority,
      customerName: newTicketData.customerName || 'Test Customer',
      customerEmail: newTicketData.customerEmail || null, // Allow null email
    };

    console.log('Creating ticket with data:', ticketData);

    try {
      const response = await apiService.createTicket(ticketData);

      if (response.success) {
        // Add new ticket to the list - ticket is in response.data.ticket
        setTickets(prev => [response.data.ticket, ...prev]);
        
        // Reset form and close modal
        setNewTicketData({
          customerName: '',
          customerEmail: '',
          subject: '',
          description: '',
          priority: 'medium' // Changed from 'normal' to 'medium'
        });
        setShowNewTicketModal(false);
        
        // Navigate to the new ticket in inbox if it has an ID
        if (response.data.ticket?._id) {
          onNavigateToInbox && onNavigateToInbox(response.data.ticket._id);
        }
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        validationErrors: error.validationErrors
      });
      // You could show an error message here
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleCancelNewTicket = () => {
    setShowNewTicketModal(false);
    setNewTicketData({
      customerName: '',
      customerEmail: '',
      subject: '',
      description: '',
      priority: 'medium' // Changed from 'normal' to 'medium'
    });
  };

  return (
    <div className="db-page tickets">
      <div className="db-page__header">
        <h1 className="db-page__title">Tickets</h1>
        <p className="db-page__sub">Manage and track all support tickets.</p>
      </div>

      <div className="tickets__toolbar">
        <div className="tickets__filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`tickets__filter ${filter === f ? 'tickets__filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          className="db-btn db-btn--primary"
          onClick={handleNewTicketClick}
        >
          + New Ticket
        </button>
      </div>

      {loading && (
        <div className="tickets__loading">
          <div className="loading-spinner"></div>
          <p>Loading tickets...</p>
        </div>
      )}

      {error && (
        <div className="tickets__error">
          <p>Failed to load tickets: {error}</p>
          <button onClick={loadTickets} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="tickets__empty">
          <p>No tickets found</p>
          {filter !== 'All' && (
            <p>Try changing the filter or create a new ticket.</p>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="db-card tickets__table-wrap">
          <table className="tickets__table">
            <thead>
              <tr>
                {['Ticket ID','Customer','Status','Assigned Agent','Priority','Created'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(filtered || []).map(t => (
                <tr 
                  key={t._id} 
                  className="tickets__row"
                  onClick={() => handleTicketClick(t)}
                >
                  <td className="tickets__id">{t.ticketNumber || t.id}</td>
                  <td className="tickets__customer">{t.customerName || t.customer?.name || t.customer}</td>
                  <td><span className={`badge badge--${STATUS_COLOR[t.status]}`}>{t.status}</span></td>
                  <td className="tickets__agent">
                    {t.assignedTo 
                      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` 
                      : (t.assignedAgent || 'Unassigned')
                    }
                  </td>
                  <td><span className={`badge badge--${PRI_COLOR[t.priority]}`}>{t.priority}</span></td>
                  <td className="tickets__time">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : t.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedTicket && (
        <div className="tickets__modal-overlay">
          <div className="tickets__modal">
            <div className="tickets__modal-header">
              <div className="tickets__modal-icon">
                <AlertTriangle size={20} />
              </div>
              <h3 className="tickets__modal-title">Assign Ticket</h3>
              <button 
                className="tickets__modal-close"
                onClick={handleCancelAssignment}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="tickets__modal-body">
              <p className="tickets__modal-text">
                You are about to be assigned to ticket <strong>#{selectedTicket.ticketNumber}</strong> for customer <strong>{selectedTicket.customerName || selectedTicket.customer?.name || selectedTicket.customer}</strong>.
              </p>
              <p className="tickets__modal-subtext">
                Once assigned, you'll be responsible for resolving this ticket and communicating with the customer.
              </p>
            </div>

            <div className="tickets__modal-actions">
              <button 
                className="db-btn db-btn--ghost"
                onClick={handleCancelAssignment}
              >
                Cancel
              </button>
              <button 
                className="db-btn db-btn--primary"
                onClick={handleAssignTicket}
              >
                Assign to Me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="tickets__modal-overlay">
          <div className="tickets__modal tickets__modal--wide">
            <div className="tickets__modal-header">
              <div className="tickets__modal-icon tickets__modal-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <h3 className="tickets__modal-title">Create New Ticket</h3>
              <button 
                className="tickets__modal-close"
                onClick={handleCancelNewTicket}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="tickets__modal-form">
              <div className="tickets__modal-body">
                <div className="tickets__form-row">
                  <div className="tickets__form-group">
                    <label className="tickets__form-label">Customer Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={newTicketData.customerName}
                      onChange={handleNewTicketChange}
                      className="tickets__form-input"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div className="tickets__form-group">
                    <label className="tickets__form-label">Customer Email *</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={newTicketData.customerEmail}
                      onChange={handleNewTicketChange}
                      className="tickets__form-input"
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="tickets__form-group">
                  <label className="tickets__form-label">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={newTicketData.subject}
                    onChange={handleNewTicketChange}
                    className="tickets__form-input"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="tickets__form-group">
                  <label className="tickets__form-label">Description *</label>
                  <textarea
                    name="description"
                    value={newTicketData.description}
                    onChange={handleNewTicketChange}
                    className="tickets__form-textarea"
                    placeholder="Detailed description of the issue..."
                    rows="4"
                    required
                  />
                </div>

                <div className="tickets__form-group">
                  <label className="tickets__form-label">Priority</label>
                  <select
                    name="priority"
                    value={newTicketData.priority}
                    onChange={handleNewTicketChange}
                    className="tickets__form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="tickets__modal-actions">
                <button 
                  type="button"
                  className="db-btn db-btn--ghost"
                  onClick={handleCancelNewTicket}
                  disabled={creatingTicket}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="db-btn db-btn--primary"
                  disabled={creatingTicket}
                >
                  {creatingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;