import React, { useState, useEffect } from 'react';
import { showNotification } from '@mantine/notifications';
import { privateKeyApi } from '../utils/privateKeyApi';
import { validatePrivateKey } from '../utils/privateKeyUtils';

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
      checked
        ? 'bg-blue-600'
        : 'bg-gray-200 dark:bg-gray-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  multiple?: boolean;
}> = ({ label, value, onChange, options, multiple = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      multiple={multiple}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const CustomTextInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  description?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', description }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
    />
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const CustomPasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}> = ({ label, value, onChange, placeholder, description }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
};

const CustomSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, min = 0, max = 100 }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{value}%</span>
    </div>
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 custom-slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .custom-slider::-moz-range-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `
      }} />
    </div>
  </div>
);

const CustomButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ onClick, loading = false, variant = 'primary', children, disabled = false, className = '' }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500 dark:border-red-600 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900"
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

  const [privateKey, setPrivateKey] = useState({
    privateKey: '',
    hasPrivateKey: false,
    loading: false,
  });

  // Check private key status on component mount
  useEffect(() => {
    checkPrivateKeyStatus();
  }, []);

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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-8 dark:bg-boxdark">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your account preferences and trading settings
          </p>
        </div>

        {/* Quick Navigation for Mobile */}
        <div className="mb-6 sm:hidden">
          <div className="rounded-xl border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Quick Navigation</h3>
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
              <button
                onClick={() => scrollToSection('private-key')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Private Key
              </button>
              <button
                onClick={() => scrollToSection('api-keys')}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                API Keys
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* General Settings */}
          <section id="general-settings" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              General Settings
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Dark Mode</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <CustomSwitch
                  checked={generalSettings.darkMode}
                  onChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, darkMode: checked })
                  }
                />
              </div>
              <CustomSelect
                label="Language"
                value={generalSettings.language}
                onChange={(value) =>
                  setGeneralSettings({ ...generalSettings, language: value })
                }
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                ]}
              />
            </div>
          </section>

          {/* Trading Preferences */}
          <section id="trading-preferences" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Trading Preferences
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <CustomSlider
                label="Risk Level"
                value={tradingPreferences.riskLevel}
                onChange={(value) =>
                  setTradingPreferences({ ...tradingPreferences, riskLevel: value })
                }
              />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Auto Trade</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Enable automatic trading based on your preferences
                  </p>
                </div>
                <CustomSwitch
                  checked={tradingPreferences.autoTrade}
                  onChange={(checked) =>
                    setTradingPreferences({ ...tradingPreferences, autoTrade: checked })
                  }
                />
              </div>
              <CustomSelect
                label="Preferred Markets"
                value={tradingPreferences.preferredMarkets}
                onChange={(value) =>
                  setTradingPreferences({ ...tradingPreferences, preferredMarkets: value })
                }
                options={[
                  { value: 'crypto', label: 'Cryptocurrency' },
                  { value: 'forex', label: 'Forex' },
                  { value: 'stocks', label: 'Stocks' },
                ]}
              />
            </div>
          </section>

          {/* Notifications */}
          <section id="notifications" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Email Notifications</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Receive trade alerts via email
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.email}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Push Notifications</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Get instant notifications in your browser
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.push}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">SMS Notifications</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Receive critical alerts via SMS
                  </p>
                </div>
                <CustomSwitch
                  checked={notifications.sms}
                  onChange={(checked) =>
                    setNotifications({ ...notifications, sms: checked })
                  }
                />
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Security
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <CustomSwitch
                  checked={security.twoFactor}
                  onChange={(checked) =>
                    setSecurity({ ...security, twoFactor: checked })
                  }
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

          {/* Private Key Management */}
          <section id="private-key" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Private Key Management
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {/* Security Notice */}
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
                    <p className="mt-1 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      Your private key is encrypted and stored securely. Never share your private key
                      with anyone. This key is required for executing trades on your behalf.
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Key Status */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Private Key Status</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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

              {/* Private Key Input */}
              {!privateKey.hasPrivateKey && (
                <div className="space-y-4">
                  <CustomPasswordInput
                    label="Private Key"
                    value={privateKey.privateKey}
                    onChange={(value) =>
                      setPrivateKey((prev) => ({ ...prev, privateKey: value }))
                    }
                    placeholder="Enter your wallet private key (64 hex characters)"
                    description="Your private key will be encrypted before storage"
                  />
                  <CustomButton
                    onClick={handleSavePrivateKey}
                    loading={privateKey.loading}
                    className="w-full sm:w-auto"
                  >
                    Save Private Key
                  </CustomButton>
                </div>
              )}

              {/* Private Key Actions */}
              {privateKey.hasPrivateKey && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <CustomButton
                    onClick={checkPrivateKeyStatus}
                    loading={privateKey.loading}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Refresh Status
                  </CustomButton>
                  <CustomButton
                    onClick={handleDeletePrivateKey}
                    loading={privateKey.loading}
                    variant="danger"
                    className="w-full sm:w-auto"
                  >
                    Delete Private Key
                  </CustomButton>
                </div>
              )}
            </div>
          </section>

          {/* API Keys */}
          <section id="api-keys" className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              API Keys
            </h2>
            <div className="space-y-4 sm:space-y-6">
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
                description="Keep your secret key confidential"
              />
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <CustomButton onClick={handleSaveSettings} className="w-full sm:w-auto">
              Save Settings
            </CustomButton>
          </div>
        </div>

        {/* Floating Save Button for Mobile */}
        {showFloatingSave && (
          <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
            <CustomButton 
              onClick={handleSaveSettings} 
              className="w-full shadow-lg"
            >
              💾 Save Settings
            </CustomButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
