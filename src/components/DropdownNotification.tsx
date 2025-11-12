import { useState } from 'react';
import ClickOutside from './ClickOutside';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ severity }: { severity: string }) => {
  switch (severity) {
    case 'success':
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </span>
      );
    case 'info':
    default:
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </span>
      );
  }
};

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { notifications, markAsRead, clearNotification, clearAllNotifications, unreadCount } =
    useNotifications();

  const handleNotificationClick = async (id: number) => {
    await markAsRead(id);
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative hidden sm:block">
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-background-light text-text-light-secondary transition-colors hover:bg-card-light hover:text-primary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary dark:hover:bg-card-dark"
      >
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 z-10 h-2 w-2 rounded-full bg-danger">
              <span className="absolute -z-10 inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
            </span>
          )}

          <span className="material-symbols-outlined text-xl">notifications</span>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 flex max-h-96 w-80 flex-col rounded-xl border border-border-light bg-card-light shadow-lg dark:border-border-dark dark:bg-card-dark"
          >
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark">
              <h5 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">Notifications</h5>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                No notifications yet
              </div>
            ) : (
              <ul className="flex max-h-[320px] flex-col overflow-y-auto">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <div
                      className={`flex gap-3 border-t border-border-light p-4 transition-colors hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark ${
                        notification.status === 'read' ? 'opacity-70' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div>
                        <NotificationIcon severity={notification.severity} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="mb-1 text-sm font-medium text-text-light-primary break-words dark:text-text-dark-primary">
                          {notification.title}
                        </h6>
                        <p className="text-sm text-text-light-secondary break-words dark:text-text-dark-secondary">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                          {formatDistanceToNow(
                            new Date(notification.created_at.includes('Z') ? notification.created_at : notification.created_at + 'Z'), 
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      <button
                        className="text-text-light-secondary transition-colors hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    </ClickOutside>
  );
};

export default DropdownNotification;
