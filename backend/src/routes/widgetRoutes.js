const express = require("express");
const router = express.Router();
const path = require("path");
const WidgetConfig = require("../models/WidgetConfig");
const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
const CSAT = require("../models/CSAT");
const aiService = require("../services/aiService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Serve the widget JavaScript file
router.get("/widget.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // Use explicit BACKEND_URL env var in production (most reliable).
  // Fall back to deriving from the request for local dev.
  let API_BASE;
  if (process.env.BACKEND_URL) {
    API_BASE = `${process.env.BACKEND_URL}/api`;
  } else {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    API_BASE = `${protocol}://${host}/api`;
  }

  const widgetScript = `(function() {
  'use strict';

  var config = window.NextGenAIConfig || window.ChatFrameConfig || {};
  var widgetKey = config.widgetKey;
  if (!widgetKey) { console.error('NextGen AI Services: widgetKey is required'); return; }

  var isOpen = false;
  var widgetConfig = null;
  var currentTicketId = sessionStorage.getItem('chatframe_ticket_id') || null;
  var conversationHistory = []; // local history for pre-ticket AI chat
  var messagePollingInterval = null;
  var lastMessageCount = 0;
  var pollFailCount = 0;
  var MAX_POLL_FAILS = 5;
  var API_BASE = '${API_BASE}';
  var pollAttemptsWithoutNewMessages = 0;
  var isFeedbackSubmittedLocal = false;

  function createWidget() {
    var widget = document.createElement('div');
    widget.id = 'chatframe-widget';
    var pos = config.position === 'bottom-left' ? 'left:20px;' : 'right:20px;';
    var color = config.primaryColor || '#6366f1';
    widget.innerHTML =
      '<div id="chatframe-button" class="cf-button">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="10" width="18" height="10" rx="3"></rect>' +
          '<circle cx="12" cy="4" r="1.5"></circle>' +
          '<path d="M12 5.5V10"></path>' +
          '<circle cx="8" cy="14" r="1" fill="currentColor"></circle>' +
          '<circle cx="16" cy="14" r="1" fill="currentColor"></circle>' +
          '<path d="M9 17h6"></path>' +
        '</svg>' +
      '</div>' +
      '<div id="chatframe-window" class="cf-window cf-hidden">' +
        '<div class="cf-header">' +
          '<div class="cf-header-info" style="display:flex;align-items:center;gap:10px;">' +
            '<div id="chatframe-logo-container" class="cf-logo-container" style="display:none;width:32px;height:32px;align-items:center;justify-content:center;"></div>' +
            '<div>' +
              '<div class="cf-title">Support Team</div>' +
              '<div class="cf-status"><span class="cf-status-dot"></span><span class="cf-status-text">Online</span></div>' +
            '</div>' +
          '</div>' +
          '<button id="chatframe-close" class="cf-close">\xd7</button>' +
        '</div>' +
        '<div class="cf-messages" id="chatframe-messages">' +
          '<div class="cf-message cf-bot"><div class="cf-message-content"><div class="cf-message-text" id="chatframe-welcome">\uD83D\uDC4B Hi there! How can we help you today?</div></div></div>' +
        '</div>' +
        '<div id="chatframe-feedback-area" class="cf-feedback-area cf-hidden">' +
          '<div class="cf-feedback-title">Rate our service</div>' +
          '<div class="cf-feedback-rating">' +
            '<span class="cf-star" data-rating="1">⭐</span>' +
            '<span class="cf-star" data-rating="2">⭐</span>' +
            '<span class="cf-star" data-rating="3">⭐</span>' +
            '<span class="cf-star" data-rating="4">⭐</span>' +
            '<span class="cf-star" data-rating="5">⭐</span>' +
          '</div>' +
          '<textarea id="chatframe-feedback-comment" placeholder="Leave an optional comment..."></textarea>' +
          '<button id="chatframe-feedback-submit" class="cf-feedback-submit">Submit Feedback</button>' +
        '</div>' +
        '<div class="cf-input-area" id="chatframe-input-area">' +
          '<input type="text" id="chatframe-input" placeholder="Type a message..." />' +
          '<button id="chatframe-send" class="cf-send">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9"></polygon></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(widget);
    return widget;
  }

  function createStyles() {
    var color = config.primaryColor || '#6366f1';
    var rgbColor = '99, 102, 241';
    if (color.indexOf('#') === 0 && color.length === 7) {
      var r = parseInt(color.substring(1, 3), 16);
      var g = parseInt(color.substring(3, 5), 16);
      var b = parseInt(color.substring(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) rgbColor = r + ',' + g + ',' + b;
    }
    var posBtn = config.position === 'bottom-left' ? 'left:20px;' : 'right:20px;';
    var posWin = config.position === 'bottom-left' ? 'left:0;' : 'right:0;';
    var origin = config.position === 'bottom-left' ? 'bottom left' : 'bottom right';
    var s = document.createElement('style');
    s.textContent = [
      '#chatframe-widget{position:fixed;' + posBtn + 'bottom:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
      '.cf-button{width:60px;height:60px;border-radius:50%;background:' + color + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:all .3s ease;animation:cf-button-waves 2.5s infinite}',
      '.cf-button svg{animation:cf-svg-say-hi 3.5s infinite ease-in-out;transform-origin:bottom center}',
      '.cf-button:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(0,0,0,.2)}',
      '@keyframes cf-button-waves {0%{box-shadow:0 4px 12px rgba(0,0,0,.15), 0 0 0 0 rgba(' + rgbColor + ',.7)} 70%{box-shadow:0 4px 12px rgba(0,0,0,.15), 0 0 0 15px rgba(' + rgbColor + ',0)} 100%{box-shadow:0 4px 12px rgba(0,0,0,.15), 0 0 0 0 rgba(' + rgbColor + ',0)}}',
      '@keyframes cf-svg-say-hi {0%,100%{transform:rotate(0deg) scale(1)} 10%{transform:rotate(12deg) scale(1.08)} 20%{transform:rotate(-10deg) scale(1.08)} 30%{transform:rotate(12deg) scale(1.08)} 40%{transform:rotate(-6deg) scale(1.08)} 50%{transform:rotate(0deg) scale(1)}}',
      '.cf-window{position:absolute;bottom:80px;' + posWin + 'width:350px;height:500px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);display:flex;flex-direction:column;overflow:hidden;transition:all .3s ease;transform-origin:' + origin + '}',
      '.cf-hidden{opacity:0;visibility:hidden;transform:scale(.8)}',
      '.cf-header{background:' + color + ';color:#fff;padding:16px;display:flex;align-items:center;justify-content:space-between}',
      '.cf-title{font-weight:600;font-size:14px}',
      '.cf-status{display:flex;align-items:center;gap:6px;font-size:12px}',
      '.cf-status-dot{width:8px;height:8px;border-radius:50%;background:#10b981}',
      '.cf-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center}',
      '.cf-messages{flex:1;padding:16px;overflow-y:auto;background:#f9fafb;-ms-overflow-style:none;scrollbar-width:none}',
      '.cf-messages::-webkit-scrollbar{display:none}',
      '.cf-message{margin-bottom:12px}',
      '.cf-message-content{display:flex;align-items:flex-end;gap:8px;flex-direction:column}',
      '.cf-message-text{background:#fff;padding:8px 12px;border-radius:12px;font-size:14px;line-height:1.4;max-width:80%;box-shadow:0 1px 2px rgba(0,0,0,.1);color:#333;word-break:break-word}',
      '.cf-message.cf-user .cf-message-content{align-items:flex-end}',
      '.cf-message.cf-user .cf-message-text{background:' + color + ';color:#fff}',
      '.cf-message.cf-bot .cf-message-content{align-items:flex-start}',
      '.cf-message.cf-bot .cf-message-text{background:#f8f9fa;color:#333;border:1px solid #e9ecef}',
      '.cf-ai-badge{font-size:11px;color:#6b7280;margin-bottom:4px;display:flex;align-items:center;gap:4px}',
      '.cf-confidence{background:#e5e7eb;padding:1px 4px;border-radius:3px;font-weight:500}',
      '.cf-input-area{padding:16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:#fff}',
      '.cf-input-area input{flex:1;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}',
      '.cf-input-area input:focus{border-color:' + color + '}',
      '.cf-send{background:' + color + ';color:#fff;border:none;border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.cf-logo{width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2)}',
      '.cf-feedback-area{padding:16px;border-top:1px solid #e5e7eb;background:#fff;display:flex;flex-direction:column;gap:10px;align-items:center}',
      '.cf-feedback-area.cf-hidden{display:none}',
      '.cf-input-area.cf-hidden{display:none}',
      '.cf-feedback-title{font-size:13px;font-weight:600;color:#374151}',
      '.cf-feedback-rating{display:flex;gap:6px;font-size:20px;cursor:pointer}',
      '.cf-star{cursor:pointer;filter:grayscale(100%);transition:transform 0.15s ease}',
      '.cf-star.cf-active, .cf-star.cf-active-hover{filter:grayscale(0%)}',
      '.cf-star:hover{transform:scale(1.2)}',
      '.cf-feedback-area textarea{width:100%;height:50px;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;outline:none;resize:none;font-family:inherit}',
      '.cf-feedback-area textarea:focus{border-color:' + color + '}',
      '.cf-feedback-submit{width:100%;padding:8px;background:' + color + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.2s}',
      '.cf-feedback-submit:hover{opacity:0.9}',
      '.cf-window.cf-feedback-mode{height:280px}',
      '.cf-feedback-mode .cf-messages{display:none}',
      '@media(max-width:480px){.cf-window{width:calc(100vw - 40px);height:calc(100vh - 100px)}}'
    ].join('');
    document.head.appendChild(s);
  }

  function addMessageToDOM(text, type) {
    var el = document.getElementById('chatframe-messages');
    var msg = document.createElement('div');
    msg.className = 'cf-message cf-' + type;
    msg.innerHTML = '<div class="cf-message-content"><div class="cf-message-text">' + text + '</div></div>';
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
  }

  function addMessageToDOMWithAI(text, type, confidence) {
    var el = document.getElementById('chatframe-messages');
    var msg = document.createElement('div');
    msg.className = 'cf-message cf-' + type;
    var badge = '<div class="cf-ai-badge">\uD83E\uDD16 AI Assistant' + (confidence ? '<span class="cf-confidence">' + Math.round(confidence * 100) + '%</span>' : '') + '</div>';
    msg.innerHTML = '<div class="cf-message-content">' + badge + '<div class="cf-message-text">' + text + '</div></div>';
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
  }

  function updateWidgetUI() {
    if (!widgetConfig) return;
    var welcomeEl = document.getElementById('chatframe-welcome');
    var titleEl = document.querySelector('.cf-title');
    var dot = document.querySelector('.cf-status-dot');
    var txt = document.querySelector('.cf-status-text');
    var logoContainer = document.getElementById('chatframe-logo-container');
    if (welcomeEl) welcomeEl.textContent = widgetConfig.isOnline ? widgetConfig.welcomeMessage : widgetConfig.offlineMessage;
    if (titleEl) titleEl.textContent = widgetConfig.companyName || 'Support Chat';
    if (dot && txt) {
      dot.style.background = widgetConfig.isOnline ? '#10b981' : '#6b7280';
      txt.textContent = widgetConfig.isOnline ? 'Online' : 'Offline';
    }
    if (logoContainer) {
      if (widgetConfig.companyLogo) {
        logoContainer.innerHTML = '<img src="' + widgetConfig.companyLogo + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2)" />';
        logoContainer.style.display = 'flex';
      } else {
        logoContainer.innerHTML = 
          '<svg width="24" height="26" viewBox="0 0 66 70" fill="none" style="display:block;">' +
            '<path d="M65.9985 32.8161C65.9985 32.3636 65.6279 31.9969 65.1707 31.9969H47.1483C46.6913 31.9969 46.3208 31.6301 46.3208 31.1776V13.4764C46.3208 13.024 45.9502 12.6572 45.493 12.6572H28.2905C27.8336 12.6572 27.4648 13.025 27.4456 13.4771C27.0232 23.5088 18.8864 31.5619 8.75026 31.9799C8.29353 31.9986 7.92188 32.3636 7.92188 32.8161V49.841C7.92188 50.2935 8.29247 50.6602 8.7496 50.6602H26.6352C27.0924 50.6602 27.463 51.027 27.463 51.4795V69.1806C27.463 69.6331 27.8336 69.9998 28.2905 69.9998H45.493C45.9502 69.9998 46.3187 69.6321 46.3382 69.1801C46.7671 59.1482 55.0272 51.095 65.1699 50.6772C65.6269 50.6585 65.9985 50.2935 65.9985 49.841V32.8161Z" fill="#fff" fill-opacity="0.3" />' +
            '<path d="M58.0765 20.1588C58.0765 19.7064 57.7059 19.3396 57.2487 19.3396H39.2266C38.7694 19.3396 38.3988 18.9728 38.3988 18.5204V0.819179C38.3988 0.36676 38.0282 0 37.571 0H20.3687C19.9116 0 19.5428 0.36781 19.5238 0.819839C19.1015 10.8515 10.9646 18.9046 0.828378 19.3226C0.371641 19.3414 0 19.7064 0 20.1588V37.1837C0 37.6362 0.37058 38.003 0.827711 38.003H18.7133C19.1704 38.003 19.541 38.3697 19.541 38.8222V56.5234C19.541 56.9759 19.9116 57.3426 20.3687 57.3426H37.571C38.0282 57.3426 38.397 56.9748 38.4162 56.5229C38.8451 46.4909 47.1052 38.4377 57.2482 38.02C57.7049 38.0012 58.0765 37.6362 58.0765 37.1837V20.1588Z" fill="#fff" />' +
          '</svg>';
        logoContainer.style.display = 'flex';
      }
    }
  }

  function loadConfig() {
    fetch(API_BASE + '/widget/config/' + widgetKey)
      .then(function(r){ return r.json(); })
      .then(function(d){ if (d.success) { widgetConfig = d.data; updateWidgetUI(); } })
      .catch(function(e){ console.error('NextGen AI Services: config load failed', e); });
  }

  function handleCSATState(ticketStatus, feedbackSubmitted) {
    var feedbackArea = document.getElementById('chatframe-feedback-area');
    var inputArea = document.getElementById('chatframe-input-area');
    var win = document.getElementById('chatframe-window');
    if (!feedbackArea || !inputArea || !win) return;
    
    var resolvedOrClosed = ticketStatus === 'resolved' || ticketStatus === 'closed';
    if (resolvedOrClosed) {
      inputArea.classList.add('cf-hidden');
      if (!feedbackSubmitted && !isFeedbackSubmittedLocal) {
        feedbackArea.classList.remove('cf-hidden');
        win.classList.add('cf-feedback-mode');
      } else {
        feedbackArea.classList.add('cf-hidden');
        win.classList.remove('cf-feedback-mode');
      }
    } else {
      inputArea.classList.remove('cf-hidden');
      feedbackArea.classList.add('cf-hidden');
      win.classList.remove('cf-feedback-mode');
    }
  }

  function pollForMessages() {
    if (!currentTicketId) return;
    var controller = new AbortController();
    var tid = setTimeout(function(){ controller.abort(); }, 5000);
    fetch(API_BASE + '/widget/messages/' + currentTicketId, { signal: controller.signal })
      .then(function(r){ clearTimeout(tid); return r.json(); })
      .then(function(data) {
        pollFailCount = 0;
        if (!data.success || !data.data || !Array.isArray(data.data.messages)) return;
        var messages = data.data.messages;
        
        if (messages.length <= lastMessageCount) {
          handleCSATState(data.data.ticketStatus, data.data.feedbackSubmitted);
          pollAttemptsWithoutNewMessages++;
          if (pollAttemptsWithoutNewMessages === 20) {
            startPolling(10000);
          } else if (pollAttemptsWithoutNewMessages >= 50) {
            startPolling(30000);
          }
          return;
        }
        pollAttemptsWithoutNewMessages = 0;
        startPolling(3000); // restore default fast polling on activity
        
        var el = document.getElementById('chatframe-messages');
        if (!el) return;
        var welcome = widgetConfig && widgetConfig.isOnline ? widgetConfig.welcomeMessage : (widgetConfig && widgetConfig.offlineMessage ? widgetConfig.offlineMessage : '\uD83D\uDC4B Hi there! How can we help you today?');
        el.innerHTML = '<div class="cf-message cf-bot"><div class="cf-message-content"><div class="cf-message-text">' + welcome + '</div></div></div>';
        messages.forEach(function(msg) {
          var type = msg.senderType === 'customer' ? 'user' : 'bot';
          if (msg.senderType === 'ai') {
            addMessageToDOMWithAI(msg.content, type, msg.aiConfidence);
          } else {
            addMessageToDOM(msg.content, type);
          }
        });
        lastMessageCount = messages.length;
        
        handleCSATState(data.data.ticketStatus, data.data.feedbackSubmitted);
      })
      .catch(function(err) {
        clearTimeout(tid);
        pollFailCount++;
        if (pollFailCount === 1 || pollFailCount % 5 === 0) {
          console.warn('NextGen AI Services Widget: Poll failed (' + pollFailCount + 'x)');
        }
        if (pollFailCount >= MAX_POLL_FAILS) {
          stopPolling();
          setTimeout(function() {
            if (currentTicketId && isOpen) { pollFailCount = 0; startPolling(); }
          }, 10000);
        }
      });
  }

  function startPolling(intervalMs) {
    var speed = intervalMs || 3000;
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(pollForMessages, speed);
  }

  function stopPolling() {
    if (messagePollingInterval) { clearInterval(messagePollingInterval); messagePollingInterval = null; }
  }

  function sendMessage(message) {
    if (!message.trim()) return;
    addMessageToDOM(message, 'user');
    pollAttemptsWithoutNewMessages = 0;
    
    // Only push to local history if no ticketId exists yet
    if (!currentTicketId) {
      conversationHistory.push({ senderType: 'user', content: message });
    }
    
    fetch(API_BASE + '/widget/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        widgetKey: widgetKey, 
        message: message, 
        ticketId: currentTicketId,
        history: conversationHistory 
      })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (!data.success) { addMessageToDOM('Sorry, there was an error. Please try again.', 'bot'); return; }
      
      var wasNew = !currentTicketId && data.data.ticketId;
      
      if (data.data.ticketId) {
        currentTicketId = data.data.ticketId;
        sessionStorage.setItem('chatframe_ticket_id', currentTicketId);
        conversationHistory = []; // clear local history since it's now in the database
        startPolling();
      }
      
      pollFailCount = 0;
      pollAttemptsWithoutNewMessages = 0;
      
      if (wasNew) { lastMessageCount = 1; }
      
      if (data.data.response) {
        if (!currentTicketId) {
          // AI-only reply, push to local history
          conversationHistory.push({ senderType: 'ai', content: data.data.response });
        }
        setTimeout(function() { addMessageToDOM(data.data.response, 'bot'); lastMessageCount++; }, 500);
      }
    })
    .catch(function() { addMessageToDOM('Sorry, there was an error. Please try again.', 'bot'); });
  }

  function toggleWidget() {
    var win = document.getElementById('chatframe-window');
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.remove('cf-hidden');
      if (currentTicketId) {
        pollAttemptsWithoutNewMessages = 0;
        pollForMessages(); // poll immediately on open
        startPolling();
      }
    } else {
      win.classList.add('cf-hidden');
      stopPolling();
    }
  }

  function init() {
    createStyles();
    createWidget();
    document.getElementById('chatframe-button').addEventListener('click', toggleWidget);
    document.getElementById('chatframe-close').addEventListener('click', toggleWidget);
    var input = document.getElementById('chatframe-input');
    input.addEventListener('focus', function() {
      if (currentTicketId && isOpen) {
        pollAttemptsWithoutNewMessages = 0;
        startPolling();
      }
    });
    document.getElementById('chatframe-send').addEventListener('click', function() { var v = input.value; input.value = ''; sendMessage(v); });
    input.addEventListener('keypress', function(e) { if (e.key === 'Enter') { var v = input.value; input.value = ''; sendMessage(v); } });
    
    // CSAT ratings setup
    var stars = document.querySelectorAll('.cf-star');
    var selectedRating = 0;
    stars.forEach(function(star) {
      star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-rating'));
        stars.forEach(function(s, idx) {
          if (idx < selectedRating) {
            s.classList.add('cf-active');
          } else {
            s.classList.remove('cf-active');
          }
        });
      });
      star.addEventListener('mouseover', function() {
        var hoverRating = parseInt(this.getAttribute('data-rating'));
        stars.forEach(function(s, idx) {
          if (idx < hoverRating) {
            s.classList.add('cf-active-hover');
          } else {
            s.classList.remove('cf-active-hover');
          }
        });
      });
      star.addEventListener('mouseout', function() {
        stars.forEach(function(s) {
          s.classList.remove('cf-active-hover');
          var rating = parseInt(s.getAttribute('data-rating'));
          if (rating <= selectedRating) {
            s.classList.add('cf-active');
          } else {
            s.classList.remove('cf-active');
          }
        });
      });
    });

    document.getElementById('chatframe-feedback-submit').addEventListener('click', function() {
      if (selectedRating === 0) {
        alert('Please select a rating');
        return;
      }
      var comment = document.getElementById('chatframe-feedback-comment').value;
      
      fetch(API_BASE + '/widget/csat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetKey: widgetKey,
          ticketId: currentTicketId,
          rating: selectedRating,
          feedback: comment
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          isFeedbackSubmittedLocal = true;
          document.getElementById('chatframe-feedback-area').classList.add('cf-hidden');
          var win = document.getElementById('chatframe-window');
          if (win) win.classList.remove('cf-feedback-mode');
          addMessageToDOM('Thank you for rating our service! (' + '⭐'.repeat(selectedRating) + ')', 'bot');
        } else {
          alert('Error submitting feedback: ' + data.message);
        }
      })
      .catch(function(err) {
        console.error('Feedback submit failed', err);
        alert('Error submitting feedback. Please try again.');
      });
    });
    
    loadConfig();
    
    // Load existing ticket history immediately on load if ticket ID is stored
    if (currentTicketId) {
      pollForMessages();
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();`;

  res.send(widgetScript);
});

// Get widget configuration by widget key (public endpoint)
router.get("/config/:widgetKey", asyncHandler(async (req, res) => {
  const { widgetKey } = req.params;
  
  const config = await WidgetConfig.findOne({ widgetKey }).select('-tenantId -createdAt -updatedAt -__v');
  
  if (!config) {
    return sendError(res, "Widget not found", 404);
  }
  
  sendSuccess(res, config, "Widget config retrieved");
}));

// Handle widget messages (public endpoint)
router.post("/message", asyncHandler(async (req, res) => {
  const { widgetKey, message, ticketId, history = [] } = req.body;
  
  if (!widgetKey || !message) {
    return sendError(res, "Widget key and message are required", 400);
  }
  
  const config = await WidgetConfig.findOne({ widgetKey });
  
  if (!config) {
    return sendError(res, "Widget not found", 404);
  }
  
  const io = req.app.get("io");
  let ticket;
  
  if (ticketId) {
    // If ticketId is provided, we work with the existing ticket in the database
    ticket = await Ticket.findOne({ _id: ticketId, tenantId: config.tenantId });
    if (!ticket) {
      return sendError(res, "Ticket not found", 404);
    }
    
    // Save customer message
    const customerMessage = await Message.create({
      tenantId: config.tenantId,
      ticketId: ticket._id,
      content: message,
      senderType: 'customer'
    });
    
    if (io) {
      io.to(`tenant:${config.tenantId}`).emit("message:new", {
        ticketId: ticket._id,
        message: customerMessage,
      });
    }
    
    let aiResponse = null;
    
    if (aiService.isAIEnabled() && config.isOnline) {
      try {
        const conversationHistory = await Message.find({ 
          tenantId: config.tenantId, 
          ticketId: ticket._id 
        })
        .sort({ createdAt: 1 })
        .limit(10)
        .lean();
        
        const shouldRespond = await aiService.shouldAutoReply(message, conversationHistory);
        if (shouldRespond) {
          const aiResult = await aiService.generateResponse(
            message, 
            conversationHistory,
            { companyName: config.companyName || 'NextGen AI Services' }
          );
          
          if (aiResult && aiResult.shouldAutoReply) {
            const aiMessage = await Message.create({
              tenantId: config.tenantId,
              ticketId: ticket._id,
              content: aiResult.response,
              senderType: 'ai',
              isAiGenerated: true,
              aiConfidence: aiResult.confidence
            });
            
            aiResponse = aiResult.response;
            
            if (io) {
              io.to(`tenant:${config.tenantId}`).emit("message:new", {
                ticketId: ticket._id,
                message: aiMessage,
              });
            }
            
            ticket.isAiHandled = true;
            ticket.aiConfidence = aiResult.confidence;
            await ticket.save({ validateBeforeSave: false });
          } else {
            ticket.isAiHandled = false;
            await ticket.save({ validateBeforeSave: false });
          }
        } else {
          ticket.isAiHandled = false;
          await ticket.save({ validateBeforeSave: false });
        }
      } catch (error) {
        console.error('❌ AI response generation failed:', error);
        ticket.isAiHandled = false;
        await ticket.save({ validateBeforeSave: false });
      }
    } else {
      ticket.isAiHandled = false;
      await ticket.save({ validateBeforeSave: false });
    }
    
    // Offline fallback for existing ticket
    if (!aiResponse && !config.isOnline) {
      aiResponse = config.offlineMessage;
      const offlineMessage = await Message.create({
        tenantId: config.tenantId,
        ticketId: ticket._id,
        content: aiResponse,
        senderType: 'ai',
        isAiGenerated: true
      });
      if (io) {
        io.to(`tenant:${config.tenantId}`).emit("message:new", {
          ticketId: ticket._id,
          message: offlineMessage,
        });
      }
    }
    
    return sendSuccess(res, { ticketId: ticket._id, response: aiResponse }, "Message sent");
    
  } else {
    // PRE-TICKET MODE: AI chat first without saving to DB unless it needs escalation (complaint/agent)
    let aiResponse = null;
    let needsEscalation = false;
    let aiResult = null;
    
    // Map client-side history format to the required model format for history context
    const mappedHistory = history.map(h => ({
      senderType: h.senderType === 'user' ? 'customer' : h.senderType,
      content: h.content || h.text
    }));
    
    if (aiService.isAIEnabled() && config.isOnline) {
      try {
        const shouldRespond = await aiService.shouldAutoReply(message, mappedHistory);
        if (shouldRespond) {
          aiResult = await aiService.generateResponse(
            message,
            mappedHistory,
            { companyName: config.companyName || 'NextGen AI Services' }
          );
          
          if (aiResult && aiResult.shouldAutoReply) {
            aiResponse = aiResult.response;
          } else {
            // Confidence low or AI decided to escalate -> Needs Escalation!
            needsEscalation = true;
          }
        } else {
          // Direct human request / shouldn't auto reply -> Needs Escalation!
          needsEscalation = true;
        }
      } catch (error) {
        console.error('❌ AI pre-ticket generation failed:', error);
        needsEscalation = true;
      }
    } else {
      // AI disabled or widget offline -> Needs Escalation (so customer can leave offline message)
      needsEscalation = true;
    }
    
    if (needsEscalation) {
      // Create a ticket automatically in the database
      console.log('🚨 Escalating pre-ticket conversation to a new Ticket!');
      
      ticket = await Ticket.create({
        tenantId: config.tenantId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        description: message,
        customerName: 'Website Visitor',
        channel: 'widget',
        status: 'open',
        priority: 'medium',
        isAiHandled: false // Escalated to human
      });
      
      // Save all previous messages from history to the database
      for (const msg of mappedHistory) {
        // Skip saving the last message since we push it separately or it is already the current message
        if (msg.content === message) continue;
        await Message.create({
          tenantId: config.tenantId,
          ticketId: ticket._id,
          content: msg.content,
          senderType: msg.senderType
        });
      }
      
      // Save current customer message
      const customerMsg = await Message.create({
        tenantId: config.tenantId,
        ticketId: ticket._id,
        content: message,
        senderType: 'customer'
      });
      
      // Select appropriate escalation reply
      aiResponse = aiResult?.response || "I am raising a ticket and connecting you with a support representative who can assist you further.";
      if (!config.isOnline && !aiResult) {
        aiResponse = config.offlineMessage;
      }
      
      // Save escalation reply message
      const escalationMsgObj = await Message.create({
        tenantId: config.tenantId,
        ticketId: ticket._id,
        content: aiResponse,
        senderType: 'ai',
        isAiGenerated: true,
        aiConfidence: aiResult?.confidence || null
      });
      
      // Emit the new escalated ticket to the tenant's socket room so agents see it
      if (io) {
        io.to(`tenant:${config.tenantId}`).emit("message:new", {
          ticketId: ticket._id,
          message: customerMsg,
        });
        io.to(`tenant:${config.tenantId}`).emit("message:new", {
          ticketId: ticket._id,
          message: escalationMsgObj,
        });
      }
      
      return sendSuccess(res, { ticketId: ticket._id, response: aiResponse }, "Ticket raised and escalated");
    } else {
      // AI responded successfully, no ticket created in DB
      return sendSuccess(res, { ticketId: null, response: aiResponse }, "AI replied");
    }
  }
}));

// Get messages for a ticket (public endpoint for widget)
router.get("/messages/:ticketId", asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  
  if (!ticketId) {
    return sendError(res, "Ticket ID is required", 400);
  }
  
  try {
    const ticket = await Ticket.findById(ticketId).select("status").lean();
    if (!ticket) {
      return sendError(res, "Ticket not found", 404);
    }

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .select('content senderType createdAt aiConfidence')
      .lean();
    
    // Check if CSAT has already been submitted for this ticket
    const csat = await CSAT.findOne({ ticketId }).select("_id").lean();

    sendSuccess(res, { 
      messages, 
      ticketStatus: ticket.status,
      feedbackSubmitted: !!csat 
    }, "Messages retrieved");
  } catch (error) {
    console.error('Error fetching messages:', error);
    sendError(res, "Failed to fetch messages", 500);
  }
}));

// Redirect to client-side public ticket view
router.get("/tickets/:ticketId/redirect", asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }
  
  const frontendUrl = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",")[0].trim();
  res.redirect(`${frontendUrl}/public/tickets/${ticketId}`);
}));

// Fetch safe ticket details for public (unauthenticated) client view
router.get("/tickets/:ticketId", asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const ticket = await Ticket.findById(ticketId)
    .populate("assignedTo", "firstName lastName email")
    .lean();
    
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }
  
  const safeTicket = {
    _id: ticket._id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    customerName: ticket.customerName,
    createdAt: ticket.createdAt,
    assignedTo: ticket.assignedTo
  };
  
  sendSuccess(res, safeTicket, "Ticket details retrieved");
}));

// Post message to ticket from public client view
router.post("/tickets/:ticketId/message", asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  
  if (!message || message.trim() === "") {
    return sendError(res, "Message content is required", 400);
  }
  
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }
  
  const customerMessage = await Message.create({
    tenantId: ticket.tenantId,
    ticketId: ticket._id,
    content: message,
    senderType: 'customer'
  });
  
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant:${ticket.tenantId}`).emit("message:new", {
      ticketId: ticket._id,
      message: customerMessage,
    });
  }
  
  // AI auto-reply logic
  let aiResponse = null;
  const config = await WidgetConfig.findOne({ tenantId: ticket.tenantId });
  if (config && aiService.isAIEnabled() && config.isOnline && ticket.status !== 'resolved' && ticket.status !== 'closed') {
    try {
      const conversationHistory = await Message.find({ 
        tenantId: ticket.tenantId, 
        ticketId: ticket._id 
      })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();
      
      const shouldRespond = await aiService.shouldAutoReply(message, conversationHistory);
      if (shouldRespond) {
        const aiResult = await aiService.generateResponse(
          message, 
          conversationHistory,
          { companyName: config.companyName || 'NextGen AI Services' }
        );
        
        if (aiResult && aiResult.shouldAutoReply) {
          const aiMessage = await Message.create({
            tenantId: ticket.tenantId,
            ticketId: ticket._id,
            content: aiResult.response,
            senderType: 'ai',
            isAiGenerated: true,
            aiConfidence: aiResult.confidence
          });
          
          aiResponse = aiResult.response;
          
          if (io) {
            io.to(`tenant:${ticket.tenantId}`).emit("message:new", {
              ticketId: ticket._id,
              message: aiMessage,
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Public Message: AI response generation failed:', error);
    }
  }
  
  sendSuccess(res, { message: customerMessage, aiResponse }, "Message sent successfully");
}));

// Submit CSAT feedback from public widget or public page
router.post("/csat", asyncHandler(async (req, res) => {
  const { widgetKey, ticketId, rating, feedback } = req.body;
  
  if (!ticketId || !rating) {
    return sendError(res, "Ticket ID and rating are required", 400);
  }
  
  let tenantId;
  let customerName = "Anonymous";
  let customerEmail = null;
  let agentId = null;

  if (widgetKey) {
    const config = await WidgetConfig.findOne({ widgetKey });
    if (config) {
      tenantId = config.tenantId;
    }
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }

  if (!tenantId) {
    tenantId = ticket.tenantId;
  }
  
  customerName = ticket.customerName || "Anonymous";
  customerEmail = ticket.customerEmail || null;
  agentId = ticket.assignedTo || null;

  const existing = await CSAT.findOne({ ticketId });
  if (existing) {
    return sendError(res, "CSAT feedback already submitted for this ticket", 409);
  }
  
  const csat = await CSAT.create({
    tenantId,
    ticketId,
    rating: parseInt(rating),
    feedback: feedback || "",
    customerName,
    customerEmail,
    agentId
  });
  
  sendSuccess(res, csat, "CSAT feedback submitted successfully");
}));

// Integration API: Fetch all tickets/queries for external client platforms
router.get("/integration/tickets", asyncHandler(async (req, res) => {
  const widgetKey = req.headers["x-widget-key"] || req.query.widgetKey;
  if (!widgetKey) {
    return sendError(res, "API authentication failed. x-widget-key header or widgetKey query param required.", 401);
  }
  
  const config = await WidgetConfig.findOne({ widgetKey });
  if (!config) {
    return sendError(res, "Invalid API key/widget key", 401);
  }
  
  const { status, customerEmail, page = 1, limit = 50 } = req.query;
  const filter = { tenantId: config.tenantId };
  if (status) filter.status = status;
  if (customerEmail) filter.customerEmail = customerEmail;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const tickets = await Ticket.find(filter)
    .populate("assignedTo", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
    
  sendSuccess(res, tickets, "Integration tickets retrieved");
}));

// Integration API: Fetch single ticket detail with messages
router.get("/integration/tickets/:ticketId", asyncHandler(async (req, res) => {
  const widgetKey = req.headers["x-widget-key"] || req.query.widgetKey;
  if (!widgetKey) {
    return sendError(res, "API authentication failed", 401);
  }
  
  const config = await WidgetConfig.findOne({ widgetKey });
  if (!config) {
    return sendError(res, "Invalid API key/widget key", 401);
  }
  
  const { ticketId } = req.params;
  const ticket = await Ticket.findOne({ _id: ticketId, tenantId: config.tenantId })
    .populate("assignedTo", "firstName lastName email")
    .lean();
    
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }
  
  const messages = await Message.find({ ticketId })
    .sort({ createdAt: 1 })
    .lean();
    
  sendSuccess(res, { ticket, messages }, "Integration ticket details retrieved");
}));

// Integration API: Create a ticket on behalf of client
router.post("/integration/tickets", asyncHandler(async (req, res) => {
  const widgetKey = req.headers["x-widget-key"] || req.query.widgetKey;
  if (!widgetKey) {
    return sendError(res, "API authentication failed", 401);
  }
  
  const config = await WidgetConfig.findOne({ widgetKey });
  if (!config) {
    return sendError(res, "Invalid API key/widget key", 401);
  }
  
  const { title, description, customerName, customerEmail, priority = "medium" } = req.body;
  if (!title) {
    return sendError(res, "Title is required", 400);
  }
  
  const ticket = await Ticket.create({
    tenantId: config.tenantId,
    title,
    description: description || "",
    customerName: customerName || "Anonymous",
    customerEmail: customerEmail || null,
    channel: "widget",
    priority,
    status: "open"
  });
  
  sendSuccess(res, ticket, "Ticket created via integration");
}));

module.exports = router;