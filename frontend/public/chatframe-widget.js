(function() {
  'use strict';
  
  console.log('NextGen AI Services Widget: Starting initialization...');
  
  // Widget configuration
  const config = window.NextGenAIConfig || window.ChatFrameConfig || {};
  const widgetKey = config.widgetKey;
  
  if (!widgetKey) {
    console.error('NextGen AI Services: widgetKey is required');
    return;
  }
  
  console.log('NextGen AI Services Widget: Config loaded', config);
  
  // Widget state
  let isOpen = false;
  let widgetConfig = null;
  let currentTicketId = null;
  let messagePollingInterval = null;
  let lastMessageCount = 0;
  let pollFailCount = 0;
  const MAX_POLL_FAILS = 5;
  const POLL_INTERVAL_MS = 3000;
  
  // API base URL — derived from where this script was loaded so it works
  // in both local dev (localhost:5000) and production automatically.
  const scriptEl = document.getElementById('nextgen-ai-sdk') ||
    document.getElementById('chatframe-sdk') ||
    Array.from(document.querySelectorAll('script[src]'))
      .find(s => s.src.includes('nextgen-ai-widget') || s.src.includes('chatframe-widget') || s.src.includes('widget.js'));

  const API_BASE = scriptEl
    ? scriptEl.src.replace(/\/api\/widget\/.*$/, '/api')
    : 'https://nextgen-ai-services-production.up.railway.app/api';
  
  // Create widget HTML
  function createWidget() {
    console.log('NextGen AI Services Widget: Creating widget elements...');
    
    const widget = document.createElement('div');
    widget.id = 'chatframe-widget';
    widget.innerHTML = `
      <div id="chatframe-button" class="cf-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div id="chatframe-window" class="cf-window cf-hidden">
        <div class="cf-header">
          <div class="cf-title">Support Chat</div>
          <div class="cf-status">
            <span class="cf-status-dot"></span>
            <span class="cf-status-text">Online</span>
          </div>
          <button id="chatframe-close" class="cf-close">×</button>
        </div>
        <div class="cf-messages" id="chatframe-messages">
          <div class="cf-message cf-bot">
            <div class="cf-message-content">
              <div class="cf-message-text" id="chatframe-welcome">
                👋 Hi there! How can we help you today?
              </div>
            </div>
          </div>
        </div>
        <div class="cf-input-area">
          <input type="text" id="chatframe-input" placeholder="Type a message..." />
          <button id="chatframe-send" class="cf-send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    console.log('NextGen AI Services Widget: Widget elements added to DOM');
    return widget;
  }
  
  // Create widget styles
  function createStyles() {
    console.log('NextGen AI Services Widget: Creating styles...');
    
    const styles = document.createElement('style');
    styles.textContent = `
      #chatframe-widget {
        position: fixed;
        ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
        bottom: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .cf-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${config.primaryColor || '#6366f1'};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
      }
      
      .cf-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }
      
      .cf-window {
        position: absolute;
        bottom: 80px;
        ${config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
        transform-origin: bottom ${config.position === 'bottom-left' ? 'left' : 'right'};
      }
      
      .cf-hidden {
        opacity: 0;
        visibility: hidden;
        transform: scale(0.8);
      }
      
      .cf-header {
        background: ${config.primaryColor || '#6366f1'};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .cf-title {
        font-weight: 600;
        font-size: 14px;
      }
      
      .cf-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      
      .cf-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
      }
      
      .cf-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .cf-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #f9fafb;
      }
      
      .cf-message {
        margin-bottom: 12px;
      }
      
      .cf-message-content {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      
      .cf-message-text {
        background: white;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        max-width: 80%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        color: #333333;
      }
      
      .cf-message.cf-user .cf-message-content {
        justify-content: flex-end;
      }
      
      .cf-message.cf-user .cf-message-text {
        background: ${config.primaryColor || '#6366f1'};
        color: white;
      }
      
      .cf-message.cf-bot .cf-message-text {
        background: #f8f9fa;
        color: #333333;
        border: 1px solid #e9ecef;
      }
      
      .cf-ai-badge {
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .cf-confidence {
        background: #e5e7eb;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: 500;
      }
      
      .cf-input-area {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        background: white;
      }
      
      .cf-input-area input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }
      
      .cf-input-area input:focus {
        border-color: ${config.primaryColor || '#6366f1'};
      }
      
      .cf-send {
        background: ${config.primaryColor || '#6366f1'};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      @media (max-width: 480px) {
        .cf-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 100px);
        }
      }
    `;
    
    document.head.appendChild(styles);
    console.log('NextGen AI Services Widget: Styles added');
  }
  
  // Load widget configuration
  async function loadConfig() {
    console.log('NextGen AI Services Widget: Loading configuration...');
    
    try {
      const response = await fetch(`${API_BASE}/widget/config/${widgetKey}`);
      const data = await response.json();
      
      if (data.success) {
        widgetConfig = data.data;
        console.log('NextGen AI Services Widget: Configuration loaded', widgetConfig);
        updateWidgetUI();
      } else {
        console.error('NextGen AI Services Widget: Failed to load config', data);
      }
    } catch (error) {
      console.error('NextGen AI Services Widget: Config load error', error);
    }
  }
  
  // Update widget UI with config
  function updateWidgetUI() {
    if (!widgetConfig) return;
    
    console.log('NextGen AI Services Widget: Updating UI with config...');
    
    const welcomeEl = document.getElementById('chatframe-welcome');
    const titleEl = document.querySelector('.cf-title');
    const statusDot = document.querySelector('.cf-status-dot');
    const statusText = document.querySelector('.cf-status-text');
    
    if (welcomeEl) {
      welcomeEl.textContent = widgetConfig.isOnline ? 
        widgetConfig.welcomeMessage : 
        widgetConfig.offlineMessage;
    }
    
    if (titleEl) {
      titleEl.textContent = widgetConfig.companyName ? 
        `${widgetConfig.companyName} Support` : 
        'Support Chat';
    }
    
    if (statusDot && statusText) {
      if (widgetConfig.isOnline) {
        statusDot.style.background = '#10b981';
        statusText.textContent = 'Online';
      } else {
        statusDot.style.background = '#6b7280';
        statusText.textContent = 'Offline';
      }
    }
  }
  
  // Poll for new messages
  async function pollForMessages() {
    if (!currentTicketId) return;
    
    // Create a fresh controller for each poll call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${API_BASE}/widget/messages/${currentTicketId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId); // cancel timeout on success
      
      const data = await response.json();
      
      // Reset fail count on success
      pollFailCount = 0;
      
      if (data.success && data.data && Array.isArray(data.data.messages)) {
        const messages = data.data.messages;
        
        if (messages.length > lastMessageCount) {
          const messagesEl = document.getElementById('chatframe-messages');
          if (messagesEl) {
            const welcomeText = widgetConfig?.isOnline 
              ? (widgetConfig.welcomeMessage || '👋 Hi there! How can we help you today?')
              : (widgetConfig?.offlineMessage || 'We are currently offline.');

            messagesEl.innerHTML = `
              <div class="cf-message cf-bot">
                <div class="cf-message-content">
                  <div class="cf-message-text" id="chatframe-welcome">${welcomeText}</div>
                </div>
              </div>
            `;
            
            messages.forEach(msg => {
              const messageType = msg.senderType === 'customer' ? 'user' : 'bot';
              if (msg.senderType === 'ai') {
                addMessageToDOMWithAI(msg.content, messageType, true, msg.aiConfidence);
              } else {
                addMessageToDOM(msg.content, messageType);
              }
            });
          }
          
          lastMessageCount = messages.length;
        }
      }
    } catch (error) {
      clearTimeout(timeoutId); // always clear timeout
      if (error.name === 'AbortError') {
        // Fetch timed out — count as a failure
      }
      pollFailCount++;
      if (pollFailCount === 1 || pollFailCount % 5 === 0) {
        console.warn(`NextGen AI Services Widget: Poll failed (${pollFailCount}x) — server may be restarting`);
      }
      if (pollFailCount >= MAX_POLL_FAILS) {
        stopMessagePolling();
        setTimeout(() => {
          if (currentTicketId && isOpen) {
            pollFailCount = 0;
            startMessagePolling();
          }
        }, 10000);
      }
    }
  }
  
  // Start polling for messages
  function startMessagePolling() {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
    }
    
    // Poll every 3 seconds for new messages
    messagePollingInterval = setInterval(pollForMessages, 3000);
    console.log('NextGen AI Services Widget: Started message polling');
  }
  
  // Stop polling for messages
  function stopMessagePolling() {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      messagePollingInterval = null;
      console.log('NextGen AI Services Widget: Stopped message polling');
    }
  }
  async function sendMessage(message) {
    if (!message.trim()) return;
    
    console.log('NextGen AI Services Widget: Sending message:', message);
    
    // Add user message to UI
    addMessage(message, 'user');
    
    try {
      const response = await fetch(`${API_BASE}/widget/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetKey,
          message,
          ticketId: currentTicketId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const wasNewTicket = !currentTicketId;
        currentTicketId = data.data.ticketId;
        console.log('NextGen AI Services Widget: Message sent successfully', data);
        
        // Reset fail count and start polling if this is a new conversation
        pollFailCount = 0;
        if (wasNewTicket) {
          startMessagePolling();
          lastMessageCount = 1; // We just sent the first message
        }
        
        // Add bot response if any
        if (data.data.response) {
          setTimeout(() => {
            addMessage(data.data.response, 'bot');
            lastMessageCount++;
          }, 500);
        }
      } else {
        console.error('NextGen AI Services Widget: Message send failed', data);
        addMessage('Sorry, there was an error sending your message. Please try again.', 'bot');
      }
    } catch (error) {
      console.error('NextGen AI Services Widget: Message send error', error);
      addMessage('Sorry, there was an error sending your message. Please try again.', 'bot');
    }
  }
  
  // Add message to UI
  function addMessage(text, type) {
    addMessageToDOM(text, type);
  }
  
  // Add message to DOM (separate function for reuse)
  function addMessageToDOM(text, type) {
    const messagesEl = document.getElementById('chatframe-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `cf-message cf-${type}`;
    messageEl.innerHTML = `
      <div class="cf-message-content">
        <div class="cf-message-text">${text}</div>
      </div>
    `;
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  
  // Add AI message to DOM with badge
  function addMessageToDOMWithAI(text, type, isAI = false, confidence = null) {
    const messagesEl = document.getElementById('chatframe-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `cf-message cf-${type}`;
    
    let aiBadge = '';
    if (isAI && type === 'bot') {
      aiBadge = `
        <div class="cf-ai-badge">
          🤖 AI Assistant
          ${confidence ? `<span class="cf-confidence">${Math.round(confidence * 100)}%</span>` : ''}
        </div>
      `;
    }
    
    messageEl.innerHTML = `
      <div class="cf-message-content">
        ${aiBadge}
        <div class="cf-message-text">${text}</div>
      </div>
    `;
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  
  // Toggle widget
  function toggleWidget() {
    const window = document.getElementById('chatframe-window');
    isOpen = !isOpen;
    
    console.log('NextGen AI Services Widget: Toggling widget', isOpen ? 'open' : 'closed');
    
    if (isOpen) {
      window.classList.remove('cf-hidden');
      // Start polling if we have an active conversation
      if (currentTicketId) {
        startMessagePolling();
      }
    } else {
      window.classList.add('cf-hidden');
      // Stop polling when widget is closed to save resources
      stopMessagePolling();
    }
  }
  
  // Initialize widget
  function init() {
    console.log('NextGen AI Services Widget: Initializing...');
    
    createStyles();
    const widget = createWidget();
    
    // Event listeners
    document.getElementById('chatframe-button').addEventListener('click', toggleWidget);
    document.getElementById('chatframe-close').addEventListener('click', toggleWidget);
    
    const input = document.getElementById('chatframe-input');
    const sendBtn = document.getElementById('chatframe-send');
    
    sendBtn.addEventListener('click', () => {
      sendMessage(input.value);
      input.value = '';
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage(input.value);
        input.value = '';
      }
    });
    
    // Load configuration
    loadConfig();
    
    console.log('NextGen AI Services Widget: Initialization complete');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();