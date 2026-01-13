import { getAuthHeaders, removeAuthToken } from './auth';
import { showNotification } from '@mantine/notifications';

// Use environment variable injected at build time (Create-React-App)
// Fallback to localhost when not provided, e.g. during local dev without Docker
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Validate API_BASE_URL is set
if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn('REACT_APP_API_BASE_URL is not set, using default:', API_BASE_URL);
}

/**
 * API client with authentication
 */
export const apiClient = {
  /**
   * GET request with authentication
   */
  get: async (endpoint: string) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Handle 401 Unauthorized (token expired or invalid)
        if (response.status === 401) {
          removeAuthToken();
          localStorage.removeItem('user');
          
          showNotification({
            title: 'Session Expired',
            message: 'Your credentials are not validated. Please sign in again.',
            color: 'red',
          });
          
          // Redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          
          throw new Error('Credentials not validated');
        }
        
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorData?.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Ignore parsing errors
          }
        }

        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return null;
      }
      
      if (contentType && contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      
      return text;
    } catch (error: any) {
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMsg = `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`;
        showNotification({
          title: 'Connection Error',
          message: errorMsg,
          color: 'red',
        });
        throw new Error(errorMsg);
      }

      // Re-throw the error if it's already been handled
      throw error;
    }
  },

  /**
   * POST request with authentication
   */
  post: async (endpoint: string, data: any) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Handle 401 Unauthorized (token expired or invalid)
        if (response.status === 401) {
          removeAuthToken();
          localStorage.removeItem('user');
          
          showNotification({
            title: 'Session Expired',
            message: 'Your credentials are not validated. Please sign in again.',
            color: 'red',
          });
          
          // Redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          
          throw new Error('Credentials not validated');
        }
        
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorData?.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Ignore parsing errors
          }
        }

        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return null;
      }
      
      if (contentType && contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      
      return text;
    } catch (error: any) {
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMsg = `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`;
        showNotification({
          title: 'Connection Error',
          message: errorMsg,
          color: 'red',
        });
        throw new Error(errorMsg);
      }

      // Re-throw the error if it's already been handled
      throw error;
    }
  },

  /**
   * PUT request with authentication
   */
  put: async (endpoint: string, data: any) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorData?.message || errorMessage;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Ignore parsing errors
          }
        }

        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMsg = `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`;
        showNotification({
          title: 'Connection Error',
          message: errorMsg,
          color: 'red',
        });
        throw new Error(errorMsg);
      }
      throw error;
    }
  },

  /**
   * PATCH request with authentication
   */
  patch: async (endpoint: string, data: any) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorData?.message || errorMessage;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Ignore parsing errors
          }
        }

        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return null;
      }
      
      if (contentType && contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      
      return text;
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMsg = `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`;
        showNotification({
          title: 'Connection Error',
          message: errorMsg,
          color: 'red',
        });
        throw new Error(errorMsg);
      }
      throw error;
    }
  },

  /**
   * DELETE request with authentication
   */
  delete: async (endpoint: string) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorData?.message || errorMessage;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Ignore parsing errors
          }
        }

        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return null;
      }
      
      if (contentType && contentType.includes('application/json')) {
        return JSON.parse(text);
      }
      
      return text;
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMsg = `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`;
        showNotification({
          title: 'Connection Error',
          message: errorMsg,
          color: 'red',
        });
        throw new Error(errorMsg);
      }
      throw error;
    }
  },
};

export const fetchBots = async () => {
  try {
    const data = await apiClient.get('/bots/get');
    return data;
  } catch (error) {
    console.error('Error fetching bots:', error);
    // Don't show additional notification here since apiClient already handles it
    throw error;
  }
};

export const pauseBot = async (botId: number) => {
  try {
    const data = await apiClient.put(`/bots/${botId}/pause`, {});

    // Show success notification
    showNotification({
      title: 'Bot Paused',
      message: `Bot #${botId} has been paused successfully`,
      color: 'green',
    });

    return data;
  } catch (error) {
    console.error(`Error pausing bot ${botId}:`, error);
    // Don't show additional notification here since apiClient already handles it
    throw error;
  }
};

export const resumeBot = async (botId: number) => {
  try {
    const data = await apiClient.put(`/bots/${botId}/resume`, {});

    // Show success notification
    showNotification({
      title: 'Bot Resumed',
      message: `Bot #${botId} has been resumed successfully`,
      color: 'green',
    });

    return data;
  } catch (error) {
    console.error(`Error resuming bot ${botId}:`, error);
    // Don't show additional notification here since apiClient already handles it
    throw error;
  }
};

export const deleteBot = async (botId: number) => {
  try {
    const data = await apiClient.delete(`/bots/${botId}`);

    // Show success notification
    showNotification({
      title: 'Bot Deleted',
      message: `Bot #${botId} has been deleted successfully`,
      color: 'green',
    });

    return data;
  } catch (error) {
    console.error(`Error deleting bot ${botId}:`, error);
    // Don't show additional notification here since apiClient already handles it
    throw error;
  }
};

// Wallet balances for authenticated user
export const getWalletBalances = async (chainId: number, tokens?: string[]) => {
  const payload: any = { chain_id: chainId };
  if (tokens && tokens.length > 0) {
    payload.tokens = tokens;
  }
  return apiClient.post('/mtrades/wallet/balances', payload);
};

/**
 * Get trade history for a specific bot
 */
export const fetchBotTradeHistory = async (botId: number) => {
  try {
    const data = await apiClient.get(`/bots/${botId}/trades`);
    return data;
  } catch (error) {
    console.error(`Error fetching trade history for bot ${botId}:`, error);
    // Don't show additional notification here since apiClient already handles it
    throw error;
  }
};

/**
 * Fetch notifications from backend
 */
export const fetchNotifications = async (status?: string, limit = 50, offset = 0) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const data = await apiClient.get(`/notifications?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async () => {
  try {
    const data = await apiClient.get('/notifications/unread-count');
    return data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number) => {
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`, {});
    return true;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const data = await apiClient.post('/notifications/mark-all-read', {});
    return data.updated || 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
};

/**
 * Wallet management functions
 */
// Private key / wallet management functions
export const fetchPrivateKeys = async (keyType?: string): Promise<any[]> => {
  try {
    const query = keyType ? `?key_type=${keyType}` : '';
    return await apiClient.get(`/private-keys/${query}`);
  } catch (error) {
    console.error('Error fetching private keys:', error);
    throw error;
  }
};

export const createPrivateKey = async (data: { name: string; private_key: string; key_type: string }): Promise<any> => {
  try {
    const result = await apiClient.post('/private-keys/', data);
    showNotification({
      title: 'Wallet Added',
      message: `Wallet "${data.name}" has been added successfully`,
      color: 'green',
    });
    return result;
  } catch (error) {
    console.error('Error creating private key:', error);
    throw error;
  }
};

export const deletePrivateKey = async (keyId: number): Promise<any> => {
  try {
    const data = await apiClient.delete(`/private-keys/${keyId}`);
    showNotification({
      title: 'Wallet Deleted',
      message: 'Wallet has been deleted successfully',
      color: 'green',
    });
    return data;
  } catch (error) {
    console.error('Error deleting private key:', error);
    throw error;
  }
};

export const updatePrivateKey = async (keyId: number, data: { name: string }): Promise<any> => {
  try {
    const result = await apiClient.put(`/private-keys/${keyId}`, data);
    showNotification({
      title: 'Wallet Updated',
      message: 'Wallet name has been updated successfully',
      color: 'green',
    });
    return result;
  } catch (error) {
    console.error('Error updating private key:', error);
    throw error;
  }
};

export const setDefaultPrivateKey = async (keyId: number): Promise<any> => {
  try {
    const result = await apiClient.post(`/private-keys/${keyId}/set-default`, {});
    showNotification({
      title: 'Default Wallet Set',
      message: 'Default wallet has been updated',
      color: 'blue',
    });
    return result;
  } catch (error) {
    console.error('Error setting default private key:', error);
    throw error;
  }
};

export const getPrivateKeyStatus = async (): Promise<any> => {
  try {
    return await apiClient.get('/private-keys/status');
  } catch (error) {
    console.error('Error getting private key status:', error);
    throw error;
  }
};
