import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from './ClickOutside';
import { useNotifications, NotificationType } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
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

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative hidden sm:block">
      <li>
        <Link
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
          }}
          to="#"
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1">
              <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
            </span>
          )}

          <svg
            className="fill-current duration-300 ease-in-out"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C8.29678 1.65928 8.24053 1.65928 8.18428 1.6874C4.92178 2.05303 2.4749 4.66865 2.4749 7.79053V13.528C2.44678 13.8093 2.39053 13.9499 2.33428 14.0343L1.7999 14.9343C1.63115 15.2155 1.63115 15.553 1.7999 15.8343C1.96865 16.0874 2.2499 16.2562 2.55928 16.2562H8.38115V16.8749C8.38115 17.2124 8.6624 17.5218 9.02803 17.5218C9.36553 17.5218 9.6749 17.2405 9.6749 16.8749V16.2562H15.4687C15.778 16.2562 16.0593 16.0874 16.228 15.8343C16.3968 15.553 16.3968 15.2155 16.1999 14.9343ZM3.23428 14.9905L3.43115 14.653C3.5999 14.3718 3.68428 14.0343 3.74053 13.6405V7.79053C3.74053 5.31553 5.70928 3.23428 8.3249 2.95303C9.92803 2.78428 11.503 3.2624 12.6562 4.2749C13.6687 5.1749 14.2312 6.38428 14.2312 7.67803V13.528C14.2312 13.9499 14.3437 14.3437 14.5968 14.7374L14.7655 14.9905H3.23428Z"
              fill=""
            />
          </svg>
        </Link>

        {dropdownOpen && (
          <div
            className={`absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80`}
          >
            <div className="flex items-center justify-between px-4.5 py-3">
              <h5 className="text-sm font-medium text-bodydark2">Notifications</h5>
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
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              <ul className="no-scrollbar flex max-h-[320px] flex-col overflow-y-auto">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <div
                      className={`flex gap-4 border-t border-stroke p-4 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 ${
                        notification.read ? 'opacity-70' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div>
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1">
                        <h6 className="mb-1 font-medium text-black dark:text-white">
                          {notification.title}
                        </h6>
                        <p className="text-sm text-body dark:text-bodydark">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <button
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
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
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </li>
    </ClickOutside>
  );
};

export default DropdownNotification;
