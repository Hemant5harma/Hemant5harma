import React, { useState, useEffect } from 'react';
import { showNotification } from '@mantine/notifications';

// Custom components to replace Mantine components for better dark mode support
const CustomSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
      checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
    } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const CustomPasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}> = ({ label, value, onChange, placeholder, description }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
    />
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const CustomTextInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  type?: string;
}> = ({ label, value, onChange, placeholder, description, type = 'text' }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
    />
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}> = ({ label, value, onChange, options, description }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const CustomRange: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}> = ({ label, value, onChange, min = 0, max = 100, step = 1, description }) => (
  <div>
    <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <span className="text-blue-600 dark:text-blue-400">{value}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full accent-blue-600"
    />
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const CustomButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, variant = 'primary', loading = false, disabled = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
    danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500 dark:border-red-600 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const SettingsPage: React.FC = () => {
  const [generalSettings, setGeneralSettings] = useState({
    darkMode: false,
    language: 'en',
  });

  const [showFloatingSave, setShowFloatingSave] = useState(false);

  const [tradingPreferences, setTradingPreferences] = useState({
    riskLevel: 50,
    autoTrade: false,
    preferredMarkets: 'crypto',
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


  // Handle floating save button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const shouldShow = scrolled > 300; // Show after scrolling 300px
      setShowFloatingSave(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSaveSettings = async () => {
    try {
      // Here you would typically save settings to backend
      // await apiClient.post('/settings', { generalSettings, tradingPreferences, notifications, security });

      showNotification({
        title: 'Success',
        message: 'Settings saved successfully',
        color: 'green',
      });
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to save settings',
        color: 'red',
      });
    }
  };

  // Quick actions for mobile
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 dark:bg-boxdark sm:p-4 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your account preferences and trading settings
          </p>
        </div>

        {/* Quick Navigation for Mobile */}
        <div className="mb-6 block sm:hidden">
          <div className="rounded-xl border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => scrollToSection('general-settings')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                General
              </button>
              <button
                onClick={() => scrollToSection('trading-preferences')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Trading
              </button>
              <button
                onClick={() => scrollToSection('notifications')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Notifications
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Security
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <section
            id="general-settings"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              General Settings
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    Dark Mode
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Switch between light and dark theme
                  </p>
                </div>
                <CustomSwitch
                  checked={generalSettings.darkMode}
                  onChange={(checked) => setGeneralSettings({ ...generalSettings, darkMode: checked })}
                />
              </div>
              <CustomSelect
                label="Language"
                value={generalSettings.language}
                onChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                ]}
                description="Select your preferred language"
              />
            </div>
          </section>

          {/* Trading Preferences */}
          <section
            id="trading-preferences"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              Trading Preferences
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <CustomRange
                label="Risk Level"
                value={tradingPreferences.riskLevel}
                onChange={(value) => setTradingPreferences({ ...tradingPreferences, riskLevel: value })}
                min={0}
                max={100}
                description="Set your risk tolerance (0 = Conservative, 100 = Aggressive)"
              />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    Auto-Trading
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Enable automatic bot trading execution
                  </p>
                </div>
                <CustomSwitch
                  checked={tradingPreferences.autoTrade}
                  onChange={(checked) => setTradingPreferences({ ...tradingPreferences, autoTrade: checked })}
                />
              </div>
              <CustomSelect
                label="Preferred Markets"
                value={tradingPreferences.preferredMarkets}
                onChange={(value) => setTradingPreferences({ ...tradingPreferences, preferredMarkets: value })}
                options={[
                  { value: 'crypto', label: 'Cryptocurrency' },
                  { value: 'forex', label: 'Forex' },
                  { value: 'stocks', label: 'Stocks' },
                  { value: 'commodities', label: 'Commodities' },
                ]}
                description="Choose your primary trading market"
              />
            </div>
          </section>

          {/* Notifications */}
          <section
            id="notifications"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              Notifications
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    Email Notifications
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Receive updates via email
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.email}
                  onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    Push Notifications
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Get instant notifications in your browser
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.push}
                  onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    SMS Notifications
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Receive critical alerts via SMS
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.sms}
                  onChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>
            </div>
          </section>

          {/* Security */}
          <section
            id="security"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              Security
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                    Two-Factor Authentication
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <CustomSwitch
                  checked={security.twoFactor}
                  onChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                />
              </div>
              <CustomPasswordInput
                label="Change Password"
                value={security.password}
                onChange={(value) => setSecurity({ ...security, password: value })}
                placeholder="Enter new password"
                description="Use a strong password with at least 8 characters"
              />
            </div>
          </section>

          {/* Wallet Management Info - Moved to DCA & Manual Trading */}
          <section
            id="wallet-management"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              🔐 Wallet Management
            </h2>
            
            {/* Information Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Wallet Management Moved
                  </h3>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300 sm:text-sm">
                    Wallet and private key management is now integrated directly into:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-blue-700 dark:text-blue-300 sm:text-sm">
                    <li><strong>DCA Trading</strong> - Add and select wallets when creating bots</li>
                    <li><strong>Manual Trading</strong> - Choose wallets for each trade</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300 sm:text-sm">
                    Each wallet has a name and can be used across multiple bots and trades. Your private keys are encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* API Keys */}
          <section
            id="api-keys"
            className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark sm:p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-xl">
              API Keys
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      API Key Information
                    </h3>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300 sm:text-sm">
                      API keys are used for external integrations and advanced trading features.
                      Keep them secure and never share them publicly.
                    </p>
                  </div>
                </div>
              </div>
              <CustomTextInput
                label="API Key"
                value={apiKeys.apiKey}
                onChange={(value) => setApiKeys({ ...apiKeys, apiKey: value })}
                placeholder="Enter your API key"
                description="Your API key for external service integrations"
              />
              <CustomPasswordInput
                label="Secret Key"
                value={apiKeys.secretKey}
                onChange={(value) => setApiKeys({ ...apiKeys, secretKey: value })}
                placeholder="Enter your secret key"
                description="Keep this secret and secure"
              />
            </div>
          </section>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-center sm:bottom-6">
            <CustomButton
              onClick={handleSaveSettings}
              className="shadow-lg"
            >
              Save All Settings
            </CustomButton>
          </div>
        </div>

        {/* Floating Save Button (Mobile) */}
        {showFloatingSave && (
          <div className="fixed bottom-4 right-4 z-10 sm:hidden">
            <CustomButton
              onClick={handleSaveSettings}
              className="shadow-xl"
            >
              Save
            </CustomButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
