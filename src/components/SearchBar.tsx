import React, { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  showMobileButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search crypto, portfolios, bots...',
  onSearch,
  className = '',
  showMobileButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={`mx-8 flex max-w-2xl flex-1 items-center justify-center ${className}`}>
      {/* Desktop Search */}
      <div className="hidden w-full max-w-md sm:block">
        <form onSubmit={handleSubmit}>
          <div className="group relative">
            <button
              type="submit"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 transition-transform duration-200 group-hover:scale-110"
            >
              <svg
                className="fill-gray-500 transition-colors duration-200 hover:fill-primary dark:fill-gray-400 dark:hover:fill-secondary"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                  fill=""
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                  fill=""
                />
              </svg>
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200/50 bg-white/50 py-3 pl-11 pr-4 text-gray-700 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 hover:bg-white/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-strokedark/50 dark:bg-transparent dark:text-bodydark dark:placeholder-bodydark2 dark:hover:bg-boxdark/20 dark:focus:border-secondary dark:focus:ring-secondary/50"
            />

            {/* Search overlay glow effect */}
            <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
          </div>
        </form>
      </div>

      {/* Mobile search button */}
      {showMobileButton && (
        <div className="sm:hidden">
          <button
            onClick={() => {
              // Could open a modal or expand search on mobile
              console.log('Mobile search clicked');
            }}
            className="rounded-xl border border-gray-200/50 bg-gray-100/50 p-2 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white dark:border-strokedark/50 dark:bg-transparent dark:hover:bg-boxdark/30"
          >
            <svg
              className="h-5 w-5 text-gray-600 dark:text-bodydark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
