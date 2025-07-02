import { apiClient } from './apiClient';

export interface PrivateKeyResponse {
  has_private_key: boolean;
  message: string;
}

export interface PrivateKeyDeleteResponse {
  success: boolean;
  message: string;
}

export const privateKeyApi = {
  // Save private key
  savePrivateKey: async (privateKey: string): Promise<PrivateKeyResponse> => {
    try {
      const response = await apiClient.post('/private-keys/save', {
        private_key: privateKey,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save private key');
    }
  },

  // Check private key status
  getPrivateKeyStatus: async (): Promise<PrivateKeyResponse> => {
    try {
      const response = await apiClient.get('/private-keys/status');
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get private key status');
    }
  },

  // Delete private key
  deletePrivateKey: async (): Promise<PrivateKeyDeleteResponse> => {
    try {
      const response = await apiClient.delete('/private-keys/delete');
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete private key');
    }
  },
};
