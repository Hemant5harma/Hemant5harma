import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeSwitcher from './DarkModeSwitcher';
import DropdownNotification from './DropdownNotification';
import ClickOutside from './ClickOutside';
import UserOne from '../assets/image/user-10.png';
import { removeAuthToken, getAuthToken } from '../utils/auth';
import { showNotification } from '@mantine/notifications';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen = false, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    // Authentication status is checked via token existence
    // Token check is handled by ProtectedRoute component
    
    // Load user info from localStorage
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        JSON.parse(userInfo);
        // Set user data if needed
      } catch (error) {
        console.error('Error parsing user info', error);
      }
    }
  }, []);

  // WALLET CONNECTION (COMMENTED OUT FOR FUTURE USE)
  /*
  // Check if a wallet is connected when the component mounts
  useEffect(() => {
    async function checkConnection() {
      if ((window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            const token = getAuthToken();
            setIsAuthenticated(!!token);
          }
        } catch (error) {
          console.error('Error fetching accounts', error);
        }
      }
    }
    checkConnection();

    // Listen for account changes
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsAuthenticated(false);
          removeAuthToken();
        } else {
          setAccount(accounts[0]);
          // Check if still authenticated
          setIsAuthenticated(!!getAuthToken());
        }
      });
    }

    return () => {
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  */

  // WALLET CONNECTION FUNCTIONS (COMMENTED OUT FOR FUTURE USE)
  /*
  // One-step wallet connection and authentication
  const connectAndAuthenticateWallet = async () => {
    if (!(window as any).ethereum) {
      showNotification({
        title: 'MetaMask Not Found',
        message: 'Please install MetaMask to connect your wallet',
        color: 'red',
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Step 1: Connect wallet
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      setAccount(walletAddress);

      showNotification({
        title: 'Wallet Connected',
        message: `Connected to ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
        color: 'blue',
      });

      // Step 2: Authenticate automatically
      setIsAuthenticating(true);

      // Create a message for the user to sign
      const message = `Sign this message to authenticate with our application: ${Date.now()}`;

      // Request signature from the user
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send the signature to the backend
      try {
        const data = await apiClient.post('/users/metamask_login', {
          address: walletAddress,
          message: message,
          signature: signature,
        });
        
        setAuthToken(data.access_token);
        setIsAuthenticated(true);

        showNotification({
          title: 'Authentication Successful',
          message: 'You are now signed in with your wallet!',
          color: 'green',
        });

        setUserDropdownOpen(false);
      } catch (error: any) {
        const errorMessage = error.message || 'Authentication failed';

        showNotification({
          title: 'Authentication Failed',
          message: errorMessage,
          color: 'red',
        });
      }
    } catch (error: any) {
      console.error('Error during wallet connection/authentication:', error);

      let errorMessage = 'Failed to connect wallet';

      if (error.code === 4001) {
        errorMessage = 'Connection request was rejected';
      } else if (error.code === -32002) {
        errorMessage = 'Please check MetaMask for pending connection request';
      } else if (error.message?.includes('User rejected')) {
        errorMessage = 'Signature request was rejected';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to server';
      }

      showNotification({
        title: 'Connection Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsConnecting(false);
      setIsAuthenticating(false);
    }
  };

  // Separate sign-in function for already connected wallets
  const signInWithConnectedWallet = async () => {
    if (!account) return;

    setIsAuthenticating(true);

    try {
      // Create a message for the user to sign
      const message = `Sign this message to authenticate with our application: ${Date.now()}`;

      // Request signature from the user
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send the signature to the backend
      try {
        const data = await apiClient.post('/users/metamask_login', {
          address: account,
          message: message,
          signature: signature,
        });
        
        setAuthToken(data.access_token);
        setIsAuthenticated(true);

        showNotification({
          title: 'Authentication Successful',
          message: 'You are now signed in with your wallet!',
          color: 'green',
        });

        setUserDropdownOpen(false);
      } catch (error: any) {
        const errorMessage = error.message || 'Authentication failed';

        showNotification({
          title: 'Authentication Failed',
          message: errorMessage,
          color: 'red',
        });
      }
    } catch (error: any) {
      console.error('Error during authentication:', error);

      let errorMessage = 'Failed to authenticate';

      if (error.message?.includes('User rejected')) {
        errorMessage = 'Signature request was rejected';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to server';
      }

      showNotification({
        title: 'Authentication Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
    setIsAuthenticated(false);
    removeAuthToken();
    setUserDropdownOpen(false);

    showNotification({
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected successfully',
      color: 'blue',
    });
  };
  */

  // Logout function
  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('user');
    setUserDropdownOpen(false);
    
    showNotification({
      title: 'Logged Out',
      message: 'You have been logged out successfully',
      color: 'blue',
    });
    
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-end border-b border-border-light bg-card-light px-4 shadow-sm dark:border-border-dark dark:bg-card-dark sm:px-6 lg:px-8">
      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dark Mode Toggle */}
        <div className="hidden sm:block">
          <DarkModeSwitcher />
        </div>

        {/* Notifications */}
        <div className="hidden sm:block">
          <DropdownNotification />
        </div>

        {/* Wallet Address (Commented out for future use) */}
        {/* {account && (
          <div className="hidden items-center gap-2 rounded-lg border border-border-light bg-background-light px-3 py-1.5 text-sm font-medium text-text-light-secondary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary lg:flex">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            <span className="font-mono">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </span>
          </div>
        )} */}

        {/* User Profile Dropdown */}
        <ClickOutside onClick={() => setUserDropdownOpen(false)} className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 rounded-full transition-all hover:ring-2 hover:ring-primary/20"
          >
            <img
              src={UserOne || '/placeholder.svg'}
              alt="User"
              className="h-10 w-10 rounded-full border-2 border-border-light dark:border-border-dark"
            />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border-light bg-card-light shadow-lg dark:border-border-dark dark:bg-card-dark">
              <ul className="flex flex-col gap-1 p-2">
                <li>
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-light-primary transition-colors hover:bg-background-light dark:text-text-dark-primary dark:hover:bg-background-dark"
                  >
                    <span className="material-symbols-outlined text-xl">person</span>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-light-primary transition-colors hover:bg-background-light dark:text-text-dark-primary dark:hover:bg-background-dark"
                  >
                    <span className="material-symbols-outlined text-xl">settings</span>
                    Account Settings
                  </Link>
                </li>
              </ul>

              {/* Wallet Connection Section (Commented out for future use) */}
              {/* <div className="border-t border-border-light px-2 py-2 dark:border-border-dark">
                {!account ? (
                  <button
                    onClick={connectAndAuthenticateWallet}
                    disabled={isConnecting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60 disabled:opacity-70"
                  >
                    {isConnecting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {isAuthenticating ? 'Authenticating...' : 'Connecting...'}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        Connect & Sign In
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {!isAuthenticated ? (
                      <button
                        onClick={signInWithConnectedWallet}
                        disabled={isAuthenticating}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isAuthenticating ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                            Signing In...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">login</span>
                            Sign In With Wallet
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary dark:bg-primary/20">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Authenticated
                      </div>
                    )}
                  </div>
                )}
              </div> */}

              {/* Logout Section */}
              <div className="border-t border-border-light dark:border-border-dark">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-light-primary transition-colors hover:bg-background-light dark:text-text-dark-primary dark:hover:bg-background-dark"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </ClickOutside>

        {/* Mobile Burger Menu */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-text-light-secondary transition-colors hover:bg-background-light dark:text-text-dark-secondary dark:hover:bg-background-dark sm:hidden"
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
