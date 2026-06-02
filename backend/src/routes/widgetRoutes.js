const express = require("express");
const router = express.Router();
const path = require("path");
const WidgetConfig = require("../models/WidgetConfig");
const { Ticket } = require("../models/Ticket");
const Message = require("../models/Message");
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
  var messagePollingInterval = null;
  var lastMessageCount = 0;
  var pollFailCount = 0;
  var MAX_POLL_FAILS = 5;
  var API_BASE = '${API_BASE}';
  var pollAttemptsWithoutNewMessages = 0;

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
          '<div class="cf-title">Support Chat</div>' +
          '<div class="cf-status"><span class="cf-status-dot"></span><span class="cf-status-text">Online</span></div>' +
          '<button id="chatframe-close" class="cf-close">\xd7</button>' +
        '</div>' +
        '<div class="cf-messages" id="chatframe-messages">' +
          '<div class="cf-message cf-bot"><div class="cf-message-content"><div class="cf-message-text" id="chatframe-welcome">\uD83D\uDC4B Hi there! How can we help you today?</div></div></div>' +
        '</div>' +
        '<div class="cf-input-area">' +
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
      '.cf-messages{flex:1;padding:16px;overflow-y:auto;background:#f9fafb}',
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
    if (welcomeEl) welcomeEl.textContent = widgetConfig.isOnline ? widgetConfig.welcomeMessage : widgetConfig.offlineMessage;
    if (titleEl) titleEl.textContent = 'Support Chat';
    if (dot && txt) {
      dot.style.background = widgetConfig.isOnline ? '#10b981' : '#6b7280';
      txt.textContent = widgetConfig.isOnline ? 'Online' : 'Offline';
    }
  }

  function loadConfig() {
    fetch(API_BASE + '/widget/config/' + widgetKey)
      .then(function(r){ return r.json(); })
      .then(function(d){ if (d.success) { widgetConfig = d.data; updateWidgetUI(); } })
      .catch(function(e){ console.error('NextGen AI Services: config load failed', e); });
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
    fetch(API_BASE + '/widget/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetKey: widgetKey, message: message, ticketId: currentTicketId })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (!data.success) { addMessageToDOM('Sorry, there was an error. Please try again.', 'bot'); return; }
      var wasNew = !currentTicketId;
      currentTicketId = data.data.ticketId;
      sessionStorage.setItem('chatframe_ticket_id', currentTicketId);
      pollFailCount = 0;
      pollAttemptsWithoutNewMessages = 0;
      startPolling();
      if (wasNew) { lastMessageCount = 1; }
      if (data.data.response) {
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
  const { widgetKey, message, ticketId } = req.body;
  
  if (!widgetKey || !message) {
    return sendError(res, "Widget key and message are required", 400);
  }
  
  const config = await WidgetConfig.findOne({ widgetKey });
  
  if (!config) {
    return sendError(res, "Widget not found", 404);
  }
  
  let ticket;
  
  if (ticketId) {
    // Find existing ticket
    ticket = await Ticket.findOne({ _id: ticketId, tenantId: config.tenantId });
  }
  
  if (!ticket) {
    // Create new ticket
    ticket = await Ticket.create({
      tenantId: config.tenantId,
      title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      description: message,
      customerName: 'Website Visitor',
      customerEmail: null,
      channel: 'widget',
      status: 'open',
      priority: 'medium',
      isAiHandled: true // Default to true when first created
    });
  }
  
  // Create customer message
  const customerMessage = await Message.create({
    tenantId: config.tenantId,
    ticketId: ticket._id,
    content: message,
    senderType: 'customer'
  });

  // Emit customer message to tenant room via Socket.io for real-time inbox updates
  const io = req.app.get("io");
  if (io) {
    io.to(`tenant:${config.tenantId}`).emit("message:new", {
      ticketId: ticket._id,
      message: customerMessage,
    });
  }

  let aiResponse = null;
  
  // Generate AI response if enabled and appropriate
  console.log('🔍 AI Check - isAIEnabled:', aiService.isAIEnabled(), 'isOnline:', config.isOnline);
  
  if (aiService.isAIEnabled() && config.isOnline) {
    try {
      // Get conversation history for context
      const conversationHistory = await Message.find({ 
        tenantId: config.tenantId, 
        ticketId: ticket._id 
      })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

      console.log('📜 Conversation history length:', conversationHistory.length);

      // Check if AI should respond
      const shouldRespond = await aiService.shouldAutoReply(message, conversationHistory);
      console.log('🤔 Should AI respond?', shouldRespond);
      
      if (shouldRespond) {
        console.log('🤖 Generating AI response for ticket:', ticket._id);
        
        const aiResult = await aiService.generateResponse(
          message, 
          conversationHistory,
          { companyName: config.companyName || 'NextGen AI Services' }
        );

        console.log('📊 AI Result:', aiResult ? `confidence=${aiResult.confidence}, shouldAutoReply=${aiResult.shouldAutoReply}` : 'null');

        if (aiResult && aiResult.shouldAutoReply) {
          // Create AI response message
          const aiMessage = await Message.create({
            tenantId: config.tenantId,
            ticketId: ticket._id,
            content: aiResult.response,
            senderType: 'ai',
            isAiGenerated: true,
            aiConfidence: aiResult.confidence
          });

          aiResponse = aiResult.response;
          console.log('✅ AI response generated with confidence:', aiResult.confidence);

          // Emit AI reply via socket for real-time inbox updates
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
          console.log('🤖 AI confidence too low (' + (aiResult?.confidence || 'null') + '), no auto-reply');
          ticket.isAiHandled = false;
          await ticket.save({ validateBeforeSave: false });
        }
      } else {
        console.log('🤖 AI auto-reply not appropriate for this conversation');
        ticket.isAiHandled = false;
        await ticket.save({ validateBeforeSave: false });
      }
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      ticket.isAiHandled = false;
      await ticket.save({ validateBeforeSave: false });
      // Continue without AI response - don't fail the entire request
    }
  } else {
    console.log('⚠️  AI disabled or widget offline - skipping AI response');
    ticket.isAiHandled = false;
    await ticket.save({ validateBeforeSave: false });
  }
  
  // Fallback offline message if no AI response and widget is offline
  if (!aiResponse && !config.isOnline) {
    aiResponse = config.offlineMessage;
    
    // Create offline auto-response message
    const offlineMessage = await Message.create({
      tenantId: config.tenantId,
      ticketId: ticket._id,
      content: aiResponse,
      senderType: 'ai',
      isAiGenerated: true
    });

    // Emit offline reply via socket
    if (io) {
      io.to(`tenant:${config.tenantId}`).emit("message:new", {
        ticketId: ticket._id,
        message: offlineMessage,
      });
    }
  }
  
  sendSuccess(res, { 
    ticketId: ticket._id,
    response: aiResponse 
  }, "Message sent");
}));

// Get messages for a ticket (public endpoint for widget)
router.get("/messages/:ticketId", asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  
  if (!ticketId) {
    return sendError(res, "Ticket ID is required", 400);
  }
  
  try {
    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .select('content senderType createdAt aiConfidence')
      .lean();
    
    sendSuccess(res, { messages }, "Messages retrieved");
  } catch (error) {
    console.error('Error fetching messages:', error);
    sendError(res, "Failed to fetch messages", 500);
  }
}));

module.exports = router;