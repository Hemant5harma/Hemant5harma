import { getAuthHeaders } from './auth';
import { showNotification } from '@mantine/notifications';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
        const errorMessage = errorData?.message || `${response.status} login failed`;
        
        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
        
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
      }
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
        const errorMessage = errorData?.message || `API error: ${response.status}`;
        
        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
        
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
      }
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
        const errorMessage = errorData?.message || `API error: ${response.status}`;
        
        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
        
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
      }
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
        const errorMessage = errorData?.message || `API error: ${response.status}`;
        
        // Show error notification
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
        
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        showNotification({
          title: 'Connection Error',
          message: 'Unable to connect to server',
          color: 'red',
        });
      }
      throw error;
    }
  },
};

export const fetchBots = async () => {
  try {
    const data = await apiClient.get("/bots/get");
    return data;
  } catch (error) {
    console.error("Error fetching bots:", error);
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
    throw error;
  }
};

/**
 * Get trade history for a specific bot
 */
export const fetchBotTradeHistory = async (botId: number) => {
  try {
    const data = await apiClient.get(`/trades/${botId}/history`);
    return data;
  } catch (error) {
    console.error(`Error fetching trade history for bot ${botId}:`, error);
    showNotification({
      title: 'Error',
      message: 'Failed to load trade history',
      color: 'red',
    });
    throw error;
  }
};