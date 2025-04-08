import { getAuthHeaders } from './auth';

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * API client with authentication
 */
export const apiClient = {
  /**
   * GET request with authentication
   */
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * POST request with authentication
   */
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * PUT request with authentication
   */
  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * DELETE request with authentication
   */
  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
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
    return data;
  } catch (error) {
    console.error(`Error pausing bot ${botId}:`, error);
    throw error;
  }
};

export const resumeBot = async (botId: number) => {
  try {
    const data = await apiClient.put(`/bots/${botId}/resume`, {});
    return data;
  } catch (error) {
    console.error(`Error resuming bot ${botId}:`, error);
    throw error;
  }
};

export const deleteBot = async (botId: number) => {
  try {
    const data = await apiClient.delete(`/bots/${botId}`);
    return data;
  } catch (error) {
    console.error(`Error deleting bot ${botId}:`, error);
    throw error;
  }
};