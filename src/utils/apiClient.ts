import { getAuthHeaders } from './auth';
import { showNotification } from '@mantine/notifications';

// Use environment variable injected at build time (Create-React-App)
// Fallback to localhost when not provided, e.g. during local dev without Docker
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * API client with authentication
 */
export const apiClient = {
  /**
   * GET request with authentication
   */
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          errorData?.message ||
          `Request failed with status ${response.status}`;

        // Show error notification only once
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Only show notification for network errors if no notification was already shown
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
        throw new Error('Unable to connect to server');
      }

      // Re-throw the error without showing another notification
      throw error;
    }
  },

  /**
   * POST request with authentication
   */
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          errorData?.message ||
          `Request failed with status ${response.status}`;

        // Show error notification only once
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Only show notification for network errors if no notification was already shown
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
        throw new Error('Unable to connect to server');
      }

      // Re-throw the error without showing another notification
      throw error;
    }
  },

  /**
   * PUT request with authentication
   */
  put: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          errorData?.message ||
          `Request failed with status ${response.status}`;

        // Show error notification only once
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Only show notification for network errors if no notification was already shown
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
        throw new Error('Unable to connect to server');
      }

      // Re-throw the error without showing another notification
      throw error;
    }
  },

  /**
   * PATCH request with authentication
   */
  patch: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          errorData?.message ||
          `Request failed with status ${response.status}`;

        // Show error notification only once
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Only show notification for network errors if no notification was already shown
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
        throw new Error('Unable to connect to server');
      }

      // Re-throw the error without showing another notification
      throw error;
    }
  },

  /**
   * DELETE request with authentication
   */
  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          errorData?.message ||
          `Request failed with status ${response.status}`;

        // Show error notification only once
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Only show notification for network errors if no notification was already shown
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
        throw new Error('Unable to connect to server');
      }

      // Re-throw the error without showing another notification
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
