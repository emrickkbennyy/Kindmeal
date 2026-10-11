/**
 * KindMeal Frontend API Service
 * Centralizes all HTTP communication between the React frontend
 * and the Python Flask backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `API request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connectivity error (e.g. Flask server not started)
    throw new ApiError(
      `Cannot connect to KindMeal backend at ${API_BASE_URL}. Ensure Flask server is running.`,
      0,
      { isNetworkError: true }
    );
  }
}

export const api = {
  /**
   * Health check
   */
  async checkHealth() {
    return request('/api/health');
  },

  /**
   * Fetch all donors and their inventory
   */
  async getDonors() {
    return request('/api/donors');
  },

  /**
   * Fetch single donor by ID
   */
  async getDonor(donorId) {
    return request(`/api/donors/${donorId}`);
  },

  /**
   * Fetch pending requests in FIFO order
   */
  async getQueue() {
    return request('/api/queue');
  },

  /**
   * Peek FRONT request
   */
  async getQueueFront() {
    return request('/api/queue/front');
  },

  /**
   * Submit new rescue request to the REAR of the queue
   */
  async submitRequest({ ngoName, donorId, requestedQuantity, requestTimestamp, contactPerson, targetBeneficiary }) {
    return request('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        ngo_name: ngoName,
        donor_id: donorId,
        requested_quantity: requestedQuantity,
        request_timestamp: requestTimestamp,
        contact_person: contactPerson,
        target_beneficiary: targetBeneficiary
      })
    });
  },

  /**
   * Process and allocate the FRONT request
   */
  async processFrontRequest() {
    return request('/api/queue/process', {
      method: 'POST'
    });
  },

  /**
   * Fetch history of completed allocations
   */
  async getAllocations() {
    return request('/api/allocations');
  },

  /**
   * Fetch dashboard statistics
   */
  async getDashboardStats() {
    return request('/api/dashboard/stats');
  },

  /**
   * Reset database and queue to demo state
   */
  async resetDemo() {
    return request('/api/demo/reset', {
      method: 'POST'
    });
  }
};

export { API_BASE_URL, ApiError };
