/**
 * Assistant Client Service
 * Provides a simple interface to communicate with secure backend assistant endpoints
 * 
 * This replaces the direct OpenAI calls with secure server-side assistant endpoints
 */

const BACKEND_URL = process.env.REACT_APP_CHAT_BACKEND_URL || 'http://localhost:3001';

class AssistantClient {
  /**
   * Send a message to the customer assistant
   * @param {string} message - User message
   * @param {object} context - User context (userId, cartItems, etc.)
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<object>} Assistant response
   */
  async sendCustomerMessage(message, context = {}, conversationHistory = []) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/assistant/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response,
        usage: data.usage,
        context: data.context
      };
    } catch (error) {
      console.error('Customer assistant error:', error);
      return {
        success: false,
        error: error.message,
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.'
      };
    }
  }

  /**
   * Send a message to the admin assistant
   * @param {string} message - Admin message
   * @param {object} context - Admin context
   * @returns {Promise<object>} Assistant response
   */
  async sendAdminMessage(message, context = {}) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/assistant/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response,
        usage: data.usage,
        context: data.context
      };
    } catch (error) {
      console.error('Admin assistant error:', error);
      return {
        success: false,
        error: error.message,
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.'
      };
    }
  }

  /**
   * Check if the backend is available
   * @returns {Promise<boolean>} True if backend is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const assistantClient = new AssistantClient();
export default assistantClient;