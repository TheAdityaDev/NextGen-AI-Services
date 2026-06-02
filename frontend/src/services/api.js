/**
 * ChatFrame API Service Layer
 * Production-grade API integration with proper error handling and auth management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, validationErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getStoredToken();
  }

  // Validate MongoDB ObjectId
  isValidObjectId(id) {
    return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Token management
  getStoredToken() {
    return localStorage.getItem('cf_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cf_token', token);
    } else {
      localStorage.removeItem('cf_token');
    }
  }

  clearAuth() {
    this.setToken(null);
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Enhanced request wrapper with proper error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle 401 - unauthorized (token expired/invalid)
      if (response.status === 401) {
        this.clearAuth();
        // Redirect to login if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError('Authentication required', 401);
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new ApiError('Too many attempts, please wait', 429);
      }

      // Handle validation errors from express-validator
      if (!data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          // Backend validation errors - convert to field-based format
          const fieldErrors = {};
          data.errors.forEach(error => {
            if (error.path) {
              fieldErrors[error.path] = error.msg;
            }
          });
          throw new ApiError(
            data.message || 'Validation failed',
            response.status,
            fieldErrors
          );
        } else {
          // General API errors
          throw new ApiError(
            data.message || 'Request failed',
            response.status
          );
        }
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      if (!navigator.onLine) {
        throw new ApiError('No internet connection', 0);
      }

      throw new ApiError(
        error.message || 'Network error occurred',
        0
      );
    }
  }

  // HTTP method helpers
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // Authentication endpoints
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.success && response.data.tokens) {
      this.setToken(response.data.tokens.accessToken);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
    } finally {
      this.clearAuth();
    }
  }

  async getUserProfile() {
    return this.get('/auth/me');
  }

  // Company onboarding endpoints
  async companyOnboardingStep1(data) {
    return this.post('/onboard/company/step-1', data);
  }

  async companyOnboardingStep2(data) {
    return this.post('/onboard/company/step-2', data);
  }

  async companyOnboardingStep3(data) {
    return this.post('/onboard/company/step-3', data);
  }

  async companyOnboardingStep4(data) {
    const response = await this.post('/onboard/company/step-4', data);
    if (response.success && response.data.tokens) {
      this.setToken(response.data.tokens.accessToken);
    }
    return response;
  }

  // Agent onboarding endpoints
  async agentOnboardingStep1(data) {
    return this.post('/onboard/agent/step-1', data);
  }

  async agentOnboardingStep2(data) {
    const response = await this.post('/onboard/agent/step-2', data);
    if (response.success && response.data.tokens) {
      this.setToken(response.data.tokens.accessToken);
    }
    return response;
  }

  // Dashboard endpoints
  async getDashboardOverview() {
    return this.get('/dashboard/overview');
  }

  // Ticket endpoints
  async getTickets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/tickets?${params}`);
  }

  async createTicket(data) {
    return this.post('/tickets', data);
  }

  async updateTicket(id, data) {
    if (!this.isValidObjectId(id)) {
      throw new ApiError('Invalid ticket ID format', 400);
    }
    return this.patch(`/tickets/${id}`, data);
  }

  // Inbox endpoints
  async getInboxConversations() {
    return this.get('/inbox/conversations');
  }

  async getInboxTicket(ticketId) {
    if (!this.isValidObjectId(ticketId)) {
      throw new ApiError('Invalid ticket ID format', 400);
    }
    return this.get(`/inbox/${ticketId}`);
  }

  async sendMessage(ticketId, data) {
    if (!this.isValidObjectId(ticketId)) {
      throw new ApiError('Invalid ticket ID format', 400);
    }
    return this.post(`/inbox/${ticketId}/send`, data);
  }

  // Analytics endpoints
  async getAnalyticsOverview(range = '30d') {
    return this.get(`/analytics/overview?range=${range}`);
  }

  // AI Config endpoints
  async getAIConfig() {
    return this.get('/ai-config');
  }

  async updateAIConfig(data) {
    return this.patch('/ai-config', data);
  }

  // AI Insights endpoints
  async getAIInsights() {
    return this.get('/ai-insights');
  }

  // AI Summarize endpoint
  async summarizeConversation(ticketId) {
    if (!this.isValidObjectId(ticketId)) {
      throw new ApiError('Invalid ticket ID format', 400);
    }
    return this.post(`/inbox/${ticketId}/summarize`);
  }

  // Widget endpoints
  async getWidgetConfig() {
    return this.get('/widget-config');
  }

  async updateWidgetConfig(data) {
    return this.patch('/widget-config', data);
  }

  // Team endpoints
  async getTeam() {
    return this.get('/team');
  }

  async getTeamInviteCode() {
    return this.get('/team/invite-code');
  }

  // Notification endpoints
  async getNotifications(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/notifications${qs ? `?${qs}` : ''}`);
  }

  async markNotificationsRead(ids = []) {
    return this.patch('/notifications/mark-read', { ids });
  }

  // CSAT endpoints
  async getCSAT() {
    return this.get('/csat');
  }

  // Organization endpoints
  async getOrganization() {
    return this.get('/organization');
  }

  async updateOrganization(data) {
    return this.patch('/organization', data);
  }

  // Profile endpoints
  async getProfile() {
    return this.get('/profile');
  }

  async updateProfile(data) {
    return this.patch('/profile', data);
  }

  async updatePassword(data) {
    return this.patch('/profile/password', data);
  }

  // Billing endpoints
  async getBilling() {
    return this.get('/billing');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiError };