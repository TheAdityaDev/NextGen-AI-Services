(function() {
  'use strict';
  
  
  
  // Widget configuration
  const config = window.NextGenAIConfig || window.ChatFrameConfig || {};
  const widgetKey = config.widgetKey;
  
  if (!widgetKey) {
    console.error('NextGen AI Services: widgetKey is required');
    return;
  }
  
  
  
  // Widget state
  let isOpen = false;
  let widgetConfig = null;
  let currentTicketId = null;
  let messagePollingInterval = null;
  let lastMessageCount = 0;
  let pollFailCount = 0;
  const MAX_POLL_FAILS = 5;
  let pollAttemptsWithoutNewMessages = 0;
  
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
    
    
    const widget = document.createElement('div');
    widget.id = 'chatframe-widget';
    widget.innerHTML = `
      <div id="chatframe-button" class="cf-button">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="10" width="18" height="10" rx="3"></rect>
          <circle cx="12" cy="4" r="1.5"></circle>
          <path d="M12 5.5V10"></path>
          <circle cx="8" cy="14" r="1" fill="currentColor"></circle>
          <circle cx="16" cy="14" r="1" fill="currentColor"></circle>
          <path d="M9 17h6"></path>
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
    
    return widget;
  }
  
  // Create widget styles
  function createStyles() {
    
    
    var color = config.primaryColor || '#6366f1';
    var rgbColor = '99, 102, 241';
    if (color.indexOf('#') === 0 && color.length === 7) {
      var r = parseInt(color.substring(1, 3), 16);
      var g = parseInt(color.substring(3, 5), 16);
      var b = parseInt(color.substring(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) rgbColor = r + ',' + g + ',' + b;
    }

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
        background: ${color};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        animation: cf-button-waves 2.5s infinite;
      }
      
      .cf-button svg {
        animation: cf-svg-say-hi 3.5s infinite ease-in-out;
        transform-origin: bottom center;
      }
      
      .cf-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }
      
      @keyframes cf-button-waves {
        0% {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 rgba(${rgbColor}, 0.7);
        }
        70% {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 15px rgba(${rgbColor}, 0);
        }
        100% {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 rgba(${rgbColor}, 0);
        }
      }
      
      @keyframes cf-svg-say-hi {
        0%, 100% { transform: rotate(0deg) scale(1); }
        10% { transform: rotate(12deg) scale(1.08); }
        20% { transform: rotate(-10deg) scale(1.08); }
        30% { transform: rotate(12deg) scale(1.08); }
        40% { transform: rotate(-6deg) scale(1.08); }
        50% { transform: rotate(0deg) scale(1); }
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
        background: ${color};
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
        flex-direction: column;
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
        word-break: break-word;
      }
      
      .cf-message.cf-user .cf-message-content {
        align-items: flex-end;
      }
      
      .cf-message.cf-user .cf-message-text {
        background: ${color};
        color: white;
      }
      
      .cf-message.cf-bot .cf-message-content {
        align-items: flex-start;
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
        border-color: ${color};
      }
      
      .cf-send {
        background: ${color};
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
    
  }
  
  // Load widget configuration
  async function loadConfig() {
    
    
    try {
      const response = await fetch(`${API_BASE}/widget/config/${widgetKey}`);
      const data = await response.json();
      
      if (data.success) {
        widgetConfig = data.data;
        
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
      titleEl.textContent = 'Support Chat';
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${API_BASE}/widget/messages/${currentTicketId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      pollFailCount = 0;
      
      if (data.success && data.data && Array.isArray(data.data.messages)) {
        const messages = data.data.messages;
        
        if (messages.length <= lastMessageCount) {
          pollAttemptsWithoutNewMessages++;
          if (pollAttemptsWithoutNewMessages === 30) {
            
            startMessagePolling(15000);
          } else if (pollAttemptsWithoutNewMessages >= 60) {
            
            stopMessagePolling();
          }
          return;
        }
        
        pollAttemptsWithoutNewMessages = 0;
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
    } catch (error) {
      clearTimeout(timeoutId);
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
  function startMessagePolling(intervalMs) {
    const speed = intervalMs || 3000;
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
    }
    messagePollingInterval = setInterval(pollForMessages, speed);
    
  }
  
  // Stop polling for messages
  function stopMessagePolling() {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      messagePollingInterval = null;
      
    }
  }
  
  async function sendMessage(message) {
    if (!message.trim()) return;
    
    
    addMessage(message, 'user');
    pollAttemptsWithoutNewMessages = 0;
    
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
        
        
        pollFailCount = 0;
        pollAttemptsWithoutNewMessages = 0;
        startMessagePolling();
        
        if (wasNewTicket) {
          lastMessageCount = 1;
        }
        
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
    
    
    
    if (isOpen) {
      window.classList.remove('cf-hidden');
      if (currentTicketId) {
        pollAttemptsWithoutNewMessages = 0;
        startMessagePolling();
      }
    } else {
      window.classList.add('cf-hidden');
      stopMessagePolling();
    }
  }
  
  // Initialize widget
  function init() {
    
    
    createStyles();
    const widget = createWidget();
    
    // Event listeners
    document.getElementById('chatframe-button').addEventListener('click', toggleWidget);
    document.getElementById('chatframe-close').addEventListener('click', toggleWidget);
    
    const input = document.getElementById('chatframe-input');
    const sendBtn = document.getElementById('chatframe-send');
    
    input.addEventListener('focus', () => {
      if (currentTicketId && isOpen) {
        pollAttemptsWithoutNewMessages = 0;
        startMessagePolling();
      }
    });

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
    
    
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();