import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showNotification } from '@mantine/notifications';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Key,
  Wallet,
  Save,
  Info,
  Moon,
  TrendingUp,
  Mail,
  Smartphone,
  MessageSquare,
} from 'lucide-react';

// Custom components with new UI theme
const CustomSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
      checked ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'
    } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
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
    <label className="mb-2 block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
      {label}
    </label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
    />
    {description && (
      <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">{description}</p>
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
    <label className="mb-2 block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
    />
    {description && (
      <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">{description}</p>
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
    <label className="mb-2 block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {description && (
      <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">{description}</p>
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
    <label className="mb-2 flex items-center justify-between text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
      {label}
      <span className="text-primary font-bold">{value}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full accent-primary"
    />
    {description && (
      <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">{description}</p>
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
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-[1.02] hover:shadow-xl focus:ring-4 focus:ring-primary/20',
    secondary: 'border-2 border-border-light bg-card-light text-text-light-primary hover:bg-background-light focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary dark:hover:bg-background-dark',
    danger: 'border-2 border-red-500 bg-card-light text-red-600 hover:bg-red-50 focus:ring-4 focus:ring-red-500/20 dark:bg-card-dark dark:text-red-400 dark:hover:bg-red-900/20',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span>Loading...</span>
        </>
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
    <div className="min-h-screen bg-background-light py-4 sm:py-6 lg:py-8 dark:bg-background-dark">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-sm sm:text-base text-text-light-secondary dark:text-text-dark-secondary">
            Manage your account preferences and trading settings
          </p>
        </motion.div>

        {/* Quick Navigation for Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 block sm:hidden"
        >
          <div className="rounded-2xl border border-border-light bg-card-light p-4 shadow-soft dark:border-border-dark dark:bg-card-dark">
            <h3 className="mb-3 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => scrollToSection('general-settings')}
                className="rounded-lg border border-border-light bg-background-light px-3 py-2 text-xs font-medium text-text-light-primary transition-colors hover:bg-card-light dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-card-dark"
              >
                General
              </button>
              <button
                onClick={() => scrollToSection('trading-preferences')}
                className="rounded-lg border border-border-light bg-background-light px-3 py-2 text-xs font-medium text-text-light-primary transition-colors hover:bg-card-light dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-card-dark"
              >
                Trading
              </button>
              <button
                onClick={() => scrollToSection('notifications')}
                className="rounded-lg border border-border-light bg-background-light px-3 py-2 text-xs font-medium text-text-light-primary transition-colors hover:bg-card-light dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-card-dark"
              >
                Notifications
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="rounded-lg border border-border-light bg-background-light px-3 py-2 text-xs font-medium text-text-light-primary transition-colors hover:bg-card-light dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-card-dark"
              >
                Security
              </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4 sm:space-y-6">
          {/* General Settings */}
          <motion.section
            id="general-settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  General Settings
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <Moon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        Dark Mode
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Switch between light and dark theme
                      </p>
                    </div>
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
            </div>
          </motion.section>

          {/* Trading Preferences */}
          <motion.section
            id="trading-preferences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Trading Preferences
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              <div className="space-y-6">
                <CustomRange
                  label="Risk Level"
                  value={tradingPreferences.riskLevel}
                  onChange={(value) => setTradingPreferences({ ...tradingPreferences, riskLevel: value })}
                  min={0}
                  max={100}
                  description="Set your risk tolerance (0 = Conservative, 100 = Aggressive)"
                />
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        Auto-Trading
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Enable automatic bot trading execution
                      </p>
                    </div>
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
            </div>
          </motion.section>

          {/* Notifications */}
          <motion.section
            id="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Notifications
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        Email Notifications
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={notifications.email}
                    onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        Push Notifications
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Get instant notifications in your browser
                      </p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={notifications.push}
                    onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        SMS Notifications
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Receive critical alerts via SMS
                      </p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={notifications.sms}
                    onChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Security */}
          <motion.section
            id="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Security
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary sm:text-base">
                        Two-Factor Authentication
                      </span>
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
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
            </div>
          </motion.section>

          {/* Wallet Management Info - Moved to DCA & Manual Trading */}
          <motion.section
            id="wallet-management"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Wallet Management
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              {/* Information Notice */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 dark:border-primary/50 dark:bg-primary/20">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-lg bg-primary/20 p-2 dark:bg-primary/30">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      Wallet Management Moved
                    </h3>
                    <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                      Wallet and private key management is now integrated directly into:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                      <li><strong className="text-text-light-primary dark:text-text-dark-primary">DCA Trading</strong> - Add and select wallets when creating bots</li>
                      <li><strong className="text-text-light-primary dark:text-text-dark-primary">Manual Trading</strong> - Choose wallets for each trade</li>
                    </ul>
                    <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
                      Each wallet has a name and can be used across multiple bots and trades. Your private keys are encrypted and stored securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* API Keys */}
          <motion.section
            id="api-keys"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  API Keys
                </h2>
              </div>
            </div>
            <div className="border-t border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark sm:p-8">
              <div className="space-y-6">
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 dark:border-primary/50 dark:bg-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-primary/20 p-2 dark:bg-primary/30">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                        API Key Information
                      </h3>
                      <p className="mt-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary sm:text-sm">
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
            </div>
          </motion.section>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="sticky bottom-4 flex justify-center sm:bottom-6"
          >
            <CustomButton
              onClick={handleSaveSettings}
              className="shadow-lg"
            >
              <Save className="h-5 w-5" />
              Save All Settings
            </CustomButton>
          </motion.div>
        </div>

        {/* Floating Save Button (Mobile) */}
        {showFloatingSave && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-10 sm:hidden"
          >
            <CustomButton
              onClick={handleSaveSettings}
              className="shadow-xl"
            >
              <Save className="h-5 w-5" />
              Save
            </CustomButton>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
