import React, { useState, useEffect } from 'react';
import { Switch, Slider, Select, TextInput, PasswordInput, Button } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { privateKeyApi } from '../utils/privateKeyApi';
import { validatePrivateKey } from '../utils/privateKeyUtils';

const SettingsPage: React.FC = () => {
  const [generalSettings, setGeneralSettings] = useState({
    darkMode: false,
    language: 'en',
  });

  const [tradingPreferences, setTradingPreferences] = useState({
    riskLevel: 50,
    autoTrade: false,
    preferredMarkets: ['crypto'] as string[],
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    password: '',
  });

  const [apiKeys, setApiKeys] = useState({
    apiKey: '',
    secretKey: '',
  });

  const [privateKey, setPrivateKey] = useState({
    privateKey: '',
    hasPrivateKey: false,
    loading: false,
  });

  // Check private key status on component mount
  useEffect(() => {
    checkPrivateKeyStatus();
  }, []);

  const checkPrivateKeyStatus = async () => {
    try {
      setPrivateKey((prev) => ({ ...prev, loading: true }));
      const response = await privateKeyApi.getPrivateKeyStatus();
      setPrivateKey((prev) => ({
        ...prev,
        hasPrivateKey: response?.has_private_key || false,
        loading: false,
      }));
    } catch (error: any) {
      console.error('Failed to check private key status:', error);
      setPrivateKey((prev) => ({
        ...prev,
        hasPrivateKey: false,
        loading: false,
      }));
    }
  };

  const handleSavePrivateKey = async () => {
    if (!privateKey.privateKey.trim()) {
      showNotification({
        title: 'Error',
        message: 'Please enter a private key',
        color: 'red',
      });
      return;
    }

    // Validate private key format
    const validation = validatePrivateKey(privateKey.privateKey);
    if (!validation.isValid) {
      showNotification({
        title: 'Invalid Private Key',
        message: validation.error,
        color: 'red',
      });
      return;
    }

    try {
      setPrivateKey((prev) => ({ ...prev, loading: true }));
      // Use the formatted private key (without 0x prefix, lowercase)
      await privateKeyApi.savePrivateKey(validation.formatted!);

      showNotification({
        title: 'Success',
        message: 'Private key saved successfully',
        color: 'green',
      });

      setPrivateKey((prev) => ({
        ...prev,
        hasPrivateKey: true,
        privateKey: '',
        loading: false,
      }));
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to save private key',
        color: 'red',
      });
      setPrivateKey((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeletePrivateKey = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your private key? This will disable trading functionality.',
      )
    ) {
      return;
    }

    try {
      setPrivateKey((prev) => ({ ...prev, loading: true }));
      await privateKeyApi.deletePrivateKey();

      showNotification({
        title: 'Success',
        message: 'Private key deleted successfully',
        color: 'green',
      });

      setPrivateKey((prev) => ({
        ...prev,
        hasPrivateKey: false,
        privateKey: '',
        loading: false,
      }));
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to delete private key',
        color: 'red',
      });
      setPrivateKey((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 text-black dark:bg-boxdark dark:text-white">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      {/* General Settings */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <Switch
              checked={generalSettings.darkMode}
              onChange={(event) =>
                setGeneralSettings({ ...generalSettings, darkMode: event.currentTarget.checked })
              }
            />
          </div>
          <Select
            label="Language"
            value={generalSettings.language}
            onChange={(value) =>
              setGeneralSettings({ ...generalSettings, language: value || 'en' })
            }
            data={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
            ]}
          />
        </div>
      </section>

      {/* Trading Preferences */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Trading Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block">Risk Level</label>
            <Slider
              value={tradingPreferences.riskLevel}
              onChange={(value) =>
                setTradingPreferences({ ...tradingPreferences, riskLevel: value })
              }
              min={0}
              max={100}
              label={(value) => `${value}%`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Auto Trade</span>
            <Switch
              checked={tradingPreferences.autoTrade}
              onChange={(event) =>
                setTradingPreferences({
                  ...tradingPreferences,
                  autoTrade: event.currentTarget.checked,
                })
              }
            />
          </div>
          <Select
            label="Preferred Markets"
            // value={tradingPreferences.preferredMarkets}
            // onChange={(value: string[]) => setTradingPreferences({ ...tradingPreferences, preferredMarkets: value })}
            data={[
              { value: 'crypto', label: 'Cryptocurrency' },
              { value: 'forex', label: 'Forex' },
              { value: 'stocks', label: 'Stocks' },
            ]}
            multiple
            clearable
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <Switch
              checked={notifications.email}
              onChange={(event) =>
                setNotifications({ ...notifications, email: event.currentTarget.checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Push Notifications</span>
            <Switch
              checked={notifications.push}
              onChange={(event) =>
                setNotifications({ ...notifications, push: event.currentTarget.checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span>SMS Notifications</span>
            <Switch
              checked={notifications.sms}
              onChange={(event) =>
                setNotifications({ ...notifications, sms: event.currentTarget.checked })
              }
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Two-Factor Authentication</span>
            <Switch
              checked={security.twoFactor}
              onChange={(event) =>
                setSecurity({ ...security, twoFactor: event.currentTarget.checked })
              }
            />
          </div>
          <PasswordInput
            label="Change Password"
            value={security.password}
            onChange={(event) => setSecurity({ ...security, password: event.currentTarget.value })}
            placeholder="Enter new password"
          />
        </div>
      </section>

      {/* Private Key Management */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Private Key Management</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Security Notice
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Your private key is encrypted and stored securely. Never share your private key
                  with anyone. This key is required for executing trades on your behalf.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div>
              <h3 className="font-medium">Private Key Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {privateKey.loading
                  ? 'Checking...'
                  : privateKey.hasPrivateKey
                    ? 'Private key is saved and encrypted'
                    : 'No private key saved'}
              </p>
            </div>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  privateKey.hasPrivateKey
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {privateKey.hasPrivateKey ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>

          {!privateKey.hasPrivateKey && (
            <div className="space-y-4">
              <PasswordInput
                label="Private Key"
                value={privateKey.privateKey}
                onChange={(event) =>
                  setPrivateKey((prev) => ({ ...prev, privateKey: event.currentTarget.value }))
                }
                placeholder="Enter your wallet private key (64 hex characters)"
                description="Your private key will be encrypted before storage"
              />
              <Button
                onClick={handleSavePrivateKey}
                loading={privateKey.loading}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Save Private Key
              </Button>
            </div>
          )}

          {privateKey.hasPrivateKey && (
            <div className="flex space-x-3">
              <Button
                onClick={checkPrivateKeyStatus}
                loading={privateKey.loading}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Refresh Status
              </Button>
              <Button
                onClick={handleDeletePrivateKey}
                loading={privateKey.loading}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-700"
              >
                Delete Private Key
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* API Keys */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">API Keys</h2>
        <div className="space-y-4">
          <TextInput
            label="API Key"
            value={apiKeys.apiKey}
            onChange={(event) => setApiKeys({ ...apiKeys, apiKey: event.currentTarget.value })}
            placeholder="Enter your API key"
          />
          <TextInput
            label="Secret Key"
            value={apiKeys.secretKey}
            onChange={(event) => setApiKeys({ ...apiKeys, secretKey: event.currentTarget.value })}
            placeholder="Enter your secret key"
            type="password"
          />
        </div>
      </section>

      {/* Save Button */}
      <Button className="bg-blue-500 text-white hover:bg-blue-600">Save Settings</Button>
    </div>
  );
};

export default SettingsPage;
