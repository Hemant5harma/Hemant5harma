import React, { useState } from 'react';
import { Switch, Slider, Select, TextInput, PasswordInput, Button } from '@mantine/core';

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

  return (
    <div className="bg-white dark:bg-boxdark text-black dark:text-white min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* General Settings */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <Switch
              checked={generalSettings.darkMode}
              onChange={(event) => setGeneralSettings({ ...generalSettings, darkMode: event.currentTarget.checked })}
            />
          </div>
          <Select
            label="Language"
            value={generalSettings.language}
            onChange={(value) => setGeneralSettings({ ...generalSettings, language: value || 'en' })}
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
        <h2 className="text-2xl font-semibold mb-4">Trading Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Risk Level</label>
            <Slider
              value={tradingPreferences.riskLevel}
              onChange={(value) => setTradingPreferences({ ...tradingPreferences, riskLevel: value })}
              min={0}
              max={100}
              label={(value) => `${value}%`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Auto Trade</span>
            <Switch
              checked={tradingPreferences.autoTrade}
              onChange={(event) => setTradingPreferences({ ...tradingPreferences, autoTrade: event.currentTarget.checked })}
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
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <Switch
              checked={notifications.email}
              onChange={(event) => setNotifications({ ...notifications, email: event.currentTarget.checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Push Notifications</span>
            <Switch
              checked={notifications.push}
              onChange={(event) => setNotifications({ ...notifications, push: event.currentTarget.checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>SMS Notifications</span>
            <Switch
              checked={notifications.sms}
              onChange={(event) => setNotifications({ ...notifications, sms: event.currentTarget.checked })}
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Two-Factor Authentication</span>
            <Switch
              checked={security.twoFactor}
              onChange={(event) => setSecurity({ ...security, twoFactor: event.currentTarget.checked })}
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

      {/* API Keys */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Keys</h2>
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
      <Button className="bg-blue-500 hover:bg-blue-600 text-white">Save Settings</Button>
    </div>
  );
};

export default SettingsPage;

