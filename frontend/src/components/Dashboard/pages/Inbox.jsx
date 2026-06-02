import { useState, useEffect } from 'react';
import { Search, Paperclip, Send, Bot, UserCheck, Sparkles } from 'lucide-react';
import './Inbox.scss';
import apiService from '../../../services/api';
import socketService from '../../../services/socket';
import { useAuth } from '../../../contexts/AuthContext';

const Inbox = ({ initialCustomerId }) => {
  const { user, getFullName } = useAuth();
  const [active, setActive] = useState(initialCustomerId || null);
  const [input, setInput] = useState('');
  const [chatData, setChatData] = useState({});
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState(false);
  const [agents, setAgents] = useState([]);

  // Load conversations from API
  useEffect(() => {
    loadConversations();
    if (user?.role === 'company_admin') {
      loadAgents();
    }
    
    // Connect socket for real-time updates
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for new messages
    const handleNewMessage = (data) => {
      if (!data || !data.ticketId || !data.message) return;
      const { ticketId, message } = data;
      
      const newMsg = {
        from: message.senderType === 'customer' ? 'customer' : 
              message.senderType === 'ai' ? 'ai' : 'agent',
        text: message.content,
        time: new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        id: message._id,
        isAiGenerated: message.isAiGenerated || false,
        aiConfidence: message.aiConfidence || null
      };

      setChatData(prev => {
        const ticketChat = prev[ticketId] || { messages: [] };
        const existingMessages = ticketChat.messages || [];
        
        // Prevent duplicate messages if already optimistically added
        if (existingMessages.some(m => m.id === newMsg.id || (m.sending && m.text === newMsg.text))) {
          return prev;
        }

        return {
          ...prev,
          [ticketId]: {
            ...ticketChat,
            messages: [...existingMessages, newMsg]
          }
        };
      });

      // Update last message preview and time in the conversation list
      setConversations(prev => 
        prev.map(c => {
          if (c._id === ticketId) {
            return {
              ...c,
              lastActivity: newMsg.time,
              preview: newMsg.text.substring(0, 50) + (newMsg.text.length > 50 ? '...' : ''),
              lastMessage: {
                content: message.content,
                senderType: message.senderType,
                createdAt: message.createdAt
              }
            };
          }
          return c;
        })
      );
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      if (active) {
        socketService.leaveTicket(active);
      }
    };
  }, []);

  // Validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Join ticket room when active conversation changes
  useEffect(() => {
    if (active && isValidObjectId(active)) {
      
      socketService.joinTicket(active);
      loadTicketDetails(active);
    }
  }, [active]);

  // Update active customer when initialCustomerId changes
  useEffect(() => {
    if (initialCustomerId && isValidObjectId(initialCustomerId)) {
      setActive(initialCustomerId);
    }
  }, [initialCustomerId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInboxConversations();
      
      if (response.success && response.data && Array.isArray(response.data.conversations)) {
        // Transform API response to match frontend expectations
        const transformedConversations = response.data.conversations.map(convo => ({
          ...convo,
          customer: {
            name: convo.customerName || 'Unknown Customer'
          },
          lastActivity: convo.lastMessage ? 
            new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'N/A',
          preview: convo.lastMessage ? 
            convo.lastMessage.content.substring(0, 50) + (convo.lastMessage.content.length > 50 ? '...' : '') : 
            'No messages',
          unreadCount: 0 // You can implement this later based on your needs
        }));

        
        setConversations(transformedConversations);
        
        // Set first conversation as active if no active conversation and we have data
        if (!active && transformedConversations.length > 0) {
          setActive(transformedConversations[0]._id);
        }
      } else {
        console.warn('Invalid conversations response:', response);
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError(error.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await apiService.getTeam();
      if (response.success && response.data && Array.isArray(response.data.members)) {
        setAgents(response.data.members);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    if (!isValidObjectId(ticketId)) {
      console.error('Invalid ticket ID:', ticketId);
      return;
    }

    try {
      const response = await apiService.getInboxTicket(ticketId);
      
      if (response.success && response.data) {
        // Transform API response to match frontend expectations
        const transformedData = {
          ...response.data.ticket,
          name: response.data.ticket.customerName || 'Unknown Customer',
          meta: `Ticket #${response.data.ticket.ticketNumber} • ${response.data.ticket.status}`,
          assignedTo: response.data.ticket.assignedTo || null,
          messages: (response.data.messages || []).map(msg => ({
            from: msg.senderType === 'customer' ? 'customer' : 
                  msg.senderType === 'ai' ? 'ai' : 'agent',
            text: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            id: msg._id,
            isAiGenerated: msg.isAiGenerated || false,
            aiConfidence: msg.aiConfidence || null
          })),
          suggestions: [
            "Thanks for reaching out! I'll help you with that.",
            "Let me look into this for you right away.",
            "I understand your concern. Here's what we can do...",
            "Is there anything else I can help you with today?"
          ],
          customerInfo: {
            name: response.data.ticket.customerName || 'N/A',
            email: response.data.ticket.customerEmail || 'N/A',
            order: 'N/A',
            plan: 'Standard'
          }
        };

        setChatData(prev => ({
          ...prev,
          [ticketId]: transformedData
        }));
      }
    } catch (error) {
      console.error('Failed to load ticket details:', error);
      // Don't show error to user, just log it
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || sendingMessage || !isValidObjectId(active)) return;

    const messageText = input.trim();
    const tempMessage = {
      from: 'agent',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sending: true
    };

    // Optimistically add message to UI
    setChatData(prev => ({
      ...prev,
      [active]: {
        ...prev[active],
        messages: [...(prev[active]?.messages || []), tempMessage]
      }
    }));

    setInput('');
    setSendingMessage(true);

    try {
      const response = await apiService.sendMessage(active, {
        content: messageText,
        senderType: 'agent'
      });

      if (response.success && response.data && response.data.message) {
        // Replace temp message with real message from server
        setChatData(prev => ({
          ...prev,
          [active]: {
            ...prev[active],
            messages: prev[active].messages.map(msg => 
              msg.sending ? {
                from: 'agent',
                text: response.data.message.content,
                time: new Date(response.data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                id: response.data.message._id,
                sending: false
              } : msg
            )
          }
        }));
      } else {
        // Just remove the sending flag if no proper response
        setChatData(prev => ({
          ...prev,
          [active]: {
            ...prev[active],
            messages: prev[active].messages.map(msg => 
              msg.sending ? { ...msg, sending: false } : msg
            )
          }
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove failed message and restore input
      setChatData(prev => ({
        ...prev,
        [active]: {
          ...prev[active],
          messages: prev[active].messages.filter(msg => !msg.sending)
        }
      }));
      setInput(messageText); // Restore input
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!isValidObjectId(active) || assigningTicket) return;
    try {
      setAssigningTicket(true);
      const res = await apiService.updateTicket(active, {
        assignedTo: user?.id || user?._id,
        status: 'in_progress',
      });
      if (res.success) {
        // Since getTicketById populates the object on retrieval and update persists it,
        // we can set the populated user object.
        const assignedToObj = { _id: user?.id || user?._id, firstName: user?.firstName, lastName: user?.lastName };
        setChatData(prev => ({
          ...prev,
          [active]: {
            ...prev[active],
            assignedTo: assignedToObj,
            status: 'in_progress',
            meta: `Ticket #${prev[active]?.ticketNumber} • in_progress`,
          }
        }));
        // Update conversation list status
        setConversations(prev =>
          prev.map(c => c._id === active ? { ...c, status: 'in_progress', assignedTo: assignedToObj } : c)
        );
      }
    } catch (e) {
      console.error('Failed to assign ticket:', e);
    } finally {
      setAssigningTicket(false);
    }
  };

  const handleAssigneeChange = async (agentId) => {
    if (!isValidObjectId(active) || assigningTicket) return;
    const targetAgentId = agentId === 'unassigned' ? null : agentId;

    try {
      setAssigningTicket(true);
      const res = await apiService.updateTicket(active, {
        assignedTo: targetAgentId
      });
      if (res.success) {
        const assignedAgent = targetAgentId 
          ? agents.find(a => a._id === targetAgentId) 
          : null;
        
        const assignedToObj = assignedAgent 
          ? { _id: assignedAgent._id, firstName: assignedAgent.firstName, lastName: assignedAgent.lastName }
          : null;

        setChatData(prev => ({
          ...prev,
          [active]: {
            ...prev[active],
            assignedTo: assignedToObj,
            ...(targetAgentId && prev[active].status === 'open' ? {
              status: 'in_progress',
              meta: `Ticket #${prev[active]?.ticketNumber} • in_progress`
            } : {})
          }
        }));

        setConversations(prev =>
          prev.map(c => c._id === active ? { 
            ...c, 
            assignedTo: assignedToObj,
            ...(targetAgentId && c.status === 'open' ? { status: 'in_progress' } : {})
          } : c)
        );
      }
    } catch (e) {
      console.error('Failed to assign ticket:', e);
    } finally {
      setAssigningTicket(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isValidObjectId(active)) return;
    try {
      const res = await apiService.updateTicket(active, { status: newStatus });
      if (res.success) {
        setChatData(prev => ({
          ...prev,
          [active]: {
            ...prev[active],
            status: newStatus,
            meta: `Ticket #${prev[active]?.ticketNumber} • ${newStatus}`,
          }
        }));
        
        setConversations(prev =>
          prev.map(c => c._id === active ? { ...c, status: newStatus } : c)
        );
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleSummarize = async () => {
    if (!isValidObjectId(active) || summarizing) return;
    try {
      setSummarizing(true);
      const res = await apiService.summarizeConversation(active);
      if (res.success && res.data && res.data.summary) {
        setSummaries(prev => ({
          ...prev,
          [active]: res.data.summary
        }));
      }
    } catch (e) {
      console.error('Failed to summarize conversation:', e);
    } finally {
      setSummarizing(false);
    }
  };

  const currentChat = chatData[active];
  const currentConvo = conversations.find(c => c._id === active);

  // Don't render if we don't have the required data
  if (loading) {
    return (
      <div className="inbox">
        <div className="inbox__loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="inbox">
        <div className="inbox__loading">
          <p>No conversations available</p>
        </div>
      </div>
    );
  }

  if (!active || !currentChat) {
    return (
      <div className="inbox">
        <div className="inbox__loading">
          <div className="loading-spinner"></div>
          <p>Loading conversation details...</p>
        </div>
      </div>
    );
  }



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="inbox">
      {/* Left — conversation list */}
      <div className="inbox__list">
        <div className="inbox__list-header">
          <span className="inbox__list-title">Inbox</span>
          <span className="badge badge--red">4 open</span>
        </div>
        <div className="inbox__search">
          <div className="inbox__search-wrapper">
            <Search size={14} className="inbox__search-icon" />
            <input className="db-input" placeholder="Search conversations…" />
          </div>
        </div>
        {(conversations || []).map(c => (
          <div
            key={c._id}
            className={`inbox__convo ${active === c._id ? 'inbox__convo--active' : ''}`}
            onClick={() => setActive(c._id)}
          >
            <div className="inbox__convo-avatar">
              {String(c.customer?.name || c.customerName || '?')[0]}
            </div>
            <div className="inbox__convo-body">
              <div className="inbox__convo-row">
                <span className="inbox__convo-name">
                  {String(c.customer?.name || c.customerName || 'Unknown')}
                </span>
                <span className="inbox__convo-time">
                  {String(c.lastActivity || 'N/A')}
                </span>
              </div>
              <div className="inbox__convo-row">
                <span className="inbox__convo-preview">
                  {String(c.preview || 'No messages')}
                </span>
                {c.unreadCount > 0 && (
                  <span className="inbox__convo-unread">{c.unreadCount}</span>
                )}
              </div>
              <span className={`badge badge--${c.priority === 'urgent' ? 'red' : c.priority === 'high' ? 'yellow' : 'ghost'}`}>
                {String(c.priority || 'normal')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle — chat window */}
      <div className="inbox__chat">
        <div className="inbox__chat-header">
          <div className="inbox__chat-avatar">
            {String(currentChat?.name || '?')[0]}
          </div>
          <div>
            <div className="inbox__chat-name">
              {String(currentChat?.name || 'Unknown')}
            </div>
            <div className="inbox__chat-meta">
              {String(currentChat?.meta || 'Loading...')}
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <span className={`badge badge--${currentConvo?.priority === 'urgent' ? 'red' : currentConvo?.priority === 'high' ? 'yellow' : 'ghost'}`}>
              {String(currentConvo?.priority || 'normal')}
            </span>
            <span className={`badge badge--${currentConvo?.status === 'resolved' ? 'green' : 'ghost'}`}>
              {String(currentConvo?.status || 'open')}
            </span>
          </div>
        </div>

        <div className="inbox__messages">
          {(currentChat?.messages || []).map((m, i) => (
            <div key={i} className={`inbox__msg inbox__msg--${m.from}`}>
              {m.from === 'ai' && (
                <div className="inbox__msg-ai-badge">
                  <Bot size={12} />
                  AI Assistant
                  {m.aiConfidence && (
                    <span className="inbox__msg-confidence">
                      {Math.round(m.aiConfidence * 100)}%
                    </span>
                  )}
                </div>
              )}
              <div className="inbox__msg-bubble">
                {String(m.text || m.content || '')}
              </div>
              <div className="inbox__msg-time">
                {String(m.time || '')}
              </div>
            </div>
          ))}
        </div>

        <div className="inbox__composer">
          <textarea
            className="inbox__composer-input"
            placeholder="Type a reply…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
          />
          <div className="inbox__composer-actions">
            <button className="db-btn db-btn--ghost">
              <Paperclip size={14} />
              Attach
            </button>
            <button 
              className="db-btn db-btn--primary"
              onClick={handleSendMessage}
              disabled={!input.trim() || sendingMessage}
            >
              <Send size={14} />
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Right — AI Copilot */}
      <div className="inbox__copilot">
        <div className="inbox__copilot-header">
          <span className="inbox__copilot-title">
            <Bot size={16} />
            AI Copilot
          </span>
          <span className="badge badge--green">Active</span>
        </div>

        <div className="inbox__copilot-section">
          <div className="inbox__copilot-label">AI Conversation Summary</div>
          {summaries[active] ? (
            <div className="inbox__summary-box">
              {summaries[active].split('\n').map((line, idx) => (
                <p key={idx} className="inbox__summary-line">{line}</p>
              ))}
              <button 
                className="db-btn db-btn--ghost inbox__summary-retry-btn"
                onClick={handleSummarize}
                disabled={summarizing}
              >
                <Sparkles size={11} />
                {summarizing ? 'Updating...' : 'Regenerate Summary'}
              </button>
            </div>
          ) : (
            <div className="inbox__summary-empty">
              <p>Get a quick AI summary of this conversation thread.</p>
              <button 
                className="db-btn db-btn--primary inbox__summary-btn"
                onClick={handleSummarize}
                disabled={summarizing}
              >
                <Sparkles size={13} />
                {summarizing ? 'Summarizing...' : 'Summarize Chat'}
              </button>
            </div>
          )}
        </div>

        <div className="inbox__copilot-section">
          <div className="inbox__copilot-label">Suggested Replies</div>
          {(currentChat?.suggestions || []).map((s, i) => (
            <div 
              key={i} 
              className="inbox__suggestion" 
              onClick={() => setInput(s)}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="inbox__copilot-section">
          <div className="inbox__copilot-label">Customer Info</div>
          <div className="inbox__info-row">
            <span>Name</span>
            <strong>{String(currentChat?.customerInfo?.name || 'N/A')}</strong>
          </div>
          <div className="inbox__info-row">
            <span>Email</span>
            <strong>{String(currentChat?.customerInfo?.email || 'N/A')}</strong>
          </div>
        </div>

        <div className="inbox__copilot-section">
          <div className="inbox__copilot-label">Ticket Status</div>
          <select
            className="db-input"
            style={{ fontSize: '12px', padding: '6px 10px' }}
            value={currentChat?.status || 'open'}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="inbox__copilot-section">
          <div className="inbox__copilot-label">Assigned Agent</div>
          {user?.role === 'company_admin' ? (
            <select
              className="db-input"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              value={currentChat?.assignedTo?._id || currentChat?.assignedTo || 'unassigned'}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={assigningTicket}
            >
              <option value="unassigned">Unassigned</option>
              {agents.map(a => (
                <option key={a._id} value={a._id}>
                  {`${a.firstName || ''} ${a.lastName || ''}`.trim()} ({a.role === 'company_admin' ? 'Admin' : 'Agent'})
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="inbox__info-row">
                <span>Agent</span>
                <strong>
                  {currentChat?.assignedTo
                    ? `${currentChat.assignedTo.firstName || ''} ${currentChat.assignedTo.lastName || ''}`.trim()
                    : 'Unassigned'}
                </strong>
              </div>
              {!currentChat?.assignedTo && (
                <button
                  className="db-btn db-btn--ghost inbox__assign-btn"
                  onClick={handleAssignToMe}
                  disabled={assigningTicket}
                >
                  <UserCheck size={13} />
                  {assigningTicket ? 'Assigning…' : 'Assign to me'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;