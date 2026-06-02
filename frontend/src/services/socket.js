/**
 * ChatFrame Socket.io Service
 * Real-time communication for inbox, notifications, and team presence
 */

import { io } from 'socket.io-client';
import apiService from './api';

// Derive socket URL — extract just the origin (protocol + host, no path)
// e.g. https://chatframe-y2j7.onrender.com/api → https://chatframe-y2j7.onrender.com
const _apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = (() => {
  try {
    const u = new URL(_apiBase);
    return u.origin; // always just protocol + host, no path
  } catch {
    return 'http://localhost:5000';
  }
})();

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.heartbeatInterval = null;
  }

  connect() {
    const token = apiService.getStoredToken();
    
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.setupEventListeners();
    this.startHeartbeat();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });
  }

  startHeartbeat() {
    // Send heartbeat every 60 seconds to maintain online presence
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit('heartbeat');
      }
    }, 60000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  // Inbox methods
  joinTicket(ticketId) {
    if (this.socket && this.connected) {
      console.log("Joining ticket room:", ticketId);
      this.socket.emit('ticket:join', { ticketId });
    }
  }

  leaveTicket(ticketId) {
    if (this.socket && this.connected) {
      this.socket.emit('ticket:leave', { ticketId });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('message:new', callback);
    }
  }

  // Team presence methods
  onAgentOnline(callback) {
    if (this.socket) {
      this.socket.on('agent:online', callback);
    }
  }

  onAgentOffline(callback) {
    if (this.socket) {
      this.socket.on('agent:offline', callback);
    }
  }

  offAgentOnline(callback) {
    if (this.socket) {
      this.socket.off('agent:online', callback);
    }
  }

  offAgentOffline(callback) {
    if (this.socket) {
      this.socket.off('agent:offline', callback);
    }
  }

  // Notification methods
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  offNotification(callback) {
    if (this.socket) {
      this.socket.off('notification:new', callback);
    }
  }

  // Generic event methods
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;