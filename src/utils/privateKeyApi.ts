import { apiClient } from './apiClient';

export interface PrivateKeyResponse {
  has_private_key: boolean;
  message: string;
}

export interface PrivateKeyDeleteResponse {
  success: boolean;
  message: string;
}

export interface PrivateKeyStatusResponse {
  eth_key: boolean;
  solana_key: boolean;
  message: string;
}

export const privateKeyApi = {
  // Save private key for specific blockchain
  savePrivateKey: async (privateKey: string, keyType: 'eth' | 'solana'): Promise<PrivateKeyResponse> => {
    try {
      const response = await apiClient.post('/private-keys/save', {
        private_key: privateKey,
        key_type: keyType,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save private key');
    }
  },

  // Check private key status for both blockchains
  getPrivateKeyStatus: async (): Promise<PrivateKeyStatusResponse> => {
    try {
      const response = await apiClient.get('/private-keys/status');
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get private key status');
    }
  },

  // Delete private key for specific blockchain
  deletePrivateKey: async (keyType: 'eth' | 'solana'): Promise<PrivateKeyDeleteResponse> => {
    try {
      const response = await apiClient.delete(`/private-keys/delete/${keyType}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete private key');
    }
  },
};
