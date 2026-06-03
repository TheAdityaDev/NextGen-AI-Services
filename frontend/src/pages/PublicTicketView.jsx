import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import './PublicTicketView.scss';

const STATUS_BADGE_COLOR = {
  open: 'badge--green',
  in_progress: 'badge--blue',
  escalated: 'badge--red',
  resolved: 'badge--yellow',
  closed: 'badge--ghost'
};

const PublicTicketView = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatHover, setCsatHover] = useState(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  const messagesEndRef = useRef(null);

  // Load ticket details and messages
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [ticketRes, messagesRes] = await Promise.all([
        apiService.getPublicTicket(ticketId),
        apiService.getPublicTicketMessages(ticketId)
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.data);
      }
      if (messagesRes.success && messagesRes.data) {
        setMessages(messagesRes.data.messages || []);
        setCsatSubmitted(messagesRes.data.feedbackSubmitted || false);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load public ticket data:', err);
      setError(err.message || 'Failed to retrieve ticket details');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Poll for new messages/status updates every 5 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await apiService.sendPublicTicketMessage(ticketId, replyText);
      if (res.success) {
        setReplyText('');
        // Reload messages immediately
        loadData(false);
      }
    } catch (err) {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCsatSubmit = async () => {
    if (csatRating === 0 || submittingCsat) return;
    setSubmittingCsat(true);

    try {
      const res = await apiService.submitPublicCSAT(ticketId, csatRating, csatFeedback);
      if (res.success) {
        setCsatSubmitted(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit CSAT feedback.');
    } finally {
      setSubmittingCsat(false);
    }
  };

  if (loading) {
    return (
      <div className="public-ticket__loading">
        <div className="loading-spinner"></div>
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-ticket__error">
        <AlertCircle size={48} className="error-icon" />
        <h2>Unable to load ticket</h2>
        <p>{error}</p>
        <button onClick={() => loadData(true)} className="db-btn db-btn--primary">Retry</button>
      </div>
    );
  }

  const isResolvedOrClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="public-ticket">
      {/* Premium Glassmorphic Header */}
      <header className="public-ticket__header">
        <div className="header-container">
          <div className="brand-logo">
            <span className="brand-logo__circle">CF</span>
            <span className="brand-logo__text">NextGen Support Portal</span>
          </div>
          <div className="ticket-meta">
            <span className="ticket-number">Ticket #{ticket.ticketNumber}</span>
            <span className={`badge ${STATUS_BADGE_COLOR[ticket.status]}`}>
              {ticket.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="public-ticket__content">
        <div className="content-container">
          {/* Left Panel: Ticket Details */}
          <section className="ticket-details-panel">
            <div className="panel-card">
              <h2 className="panel-card__title">{ticket.title}</h2>
              <div className="panel-card__meta">
                <div className="meta-item">
                  <span className="meta-label">Customer Name</span>
                  <span className="meta-value">{ticket.customerName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Assigned Agent</span>
                  <span className="meta-value">
                    {ticket.assignedTo 
                      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Created At</span>
                  <span className="meta-value">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="panel-card__description">
                <h3>Initial Request Description</h3>
                <p>{ticket.description || 'No description provided.'}</p>
              </div>
            </div>
          </section>

          {/* Right Panel: Conversation Timeline & Replies */}
          <section className="conversation-panel">
            <div className="conversation-card">
              {/* Messages Timeline */}
              <div className="messages-viewport">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <Clock size={32} />
                    <p>No conversation history yet. Send a message to start.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isCustomer = m.senderType === 'customer';
                    const isAi = m.senderType === 'ai';
                    
                    return (
                      <div 
                        key={m._id || m.createdAt} 
                        className={`message-row ${isCustomer ? 'message-row--customer' : 'message-row--agent'}`}
                      >
                        <div className="message-bubble-wrapper">
                          {isAi && (
                            <div className="ai-tag">
                              <span>🤖 AI Assistant</span>
                              {m.aiConfidence && (
                                <span className="ai-confidence">
                                  {Math.round(m.aiConfidence * 100)}%
                                </span>
                              )}
                            </div>
                          )}
                          <div className="message-bubble">
                            {m.content}
                          </div>
                          <div className="message-time">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area / CSAT Form */}
              <div className="interaction-area">
                {isResolvedOrClosed ? (
                  /* CSAT Rating Overlay */
                  <div className="csat-card">
                    {csatSubmitted ? (
                      <div className="csat-card__success">
                        <CheckCircle size={40} className="success-icon" />
                        <h3>Feedback Received!</h3>
                        <p>Thank you for letting us know how we did. Your rating has been recorded.</p>
                      </div>
                    ) : (
                      <div className="csat-card__form">
                        <h3>How was your support experience?</h3>
                        <p>This ticket has been marked as {ticket.status}. Please take a moment to rate our agent's assistance.</p>
                        
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= (csatHover || csatRating) ? 'star-btn--filled' : ''}`}
                              onClick={() => setCsatRating(star)}
                              onMouseEnter={() => setCsatHover(star)}
                              onMouseLeave={() => setCsatHover(0)}
                            >
                              <Star size={28} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          placeholder="Tell us what went well or what we can improve (optional)..."
                          value={csatFeedback}
                          onChange={(e) => setCsatFeedback(e.target.value)}
                          className="feedback-textarea"
                          rows={3}
                        />

                        <button
                          type="button"
                          className="db-btn db-btn--primary csat-submit-btn"
                          onClick={handleCsatSubmit}
                          disabled={csatRating === 0 || submittingCsat}
                        >
                          {submittingCsat ? 'Submitting...' : 'Submit Rating'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Message Composer Form */
                  <form onSubmit={handleSendMessage} className="composer-form">
                    <input
                      type="text"
                      placeholder="Type a reply and press enter..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sending}
                      className="composer-input"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className="composer-submit-btn"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PublicTicketView;
