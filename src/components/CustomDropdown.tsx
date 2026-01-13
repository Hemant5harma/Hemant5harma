import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value || (value === null && opt.value === ''));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Adjust dropdown position after it's rendered
      const adjustPosition = () => {
        if (menuRef.current && dropdownRef.current) {
          // Reset styles first
          menuRef.current.style.top = '';
          menuRef.current.style.bottom = '';
          menuRef.current.style.marginTop = '';
          menuRef.current.style.marginBottom = '';
          
          // Force a reflow to get accurate measurements
          void menuRef.current.offsetHeight;
          
          const rect = dropdownRef.current.getBoundingClientRect();
          const menuHeight = menuRef.current.offsetHeight || 256; // fallback to max-h-64
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          // If not enough space below but enough above, open upward
          if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
            menuRef.current.style.bottom = '100%';
            menuRef.current.style.top = 'auto';
            menuRef.current.style.marginTop = '0';
            menuRef.current.style.marginBottom = '0.25rem';
          } else {
            menuRef.current.style.bottom = 'auto';
            menuRef.current.style.top = '100%';
            menuRef.current.style.marginTop = '0.25rem';
            menuRef.current.style.marginBottom = '0';
          }
        }
      };
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(adjustPosition);
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value === '' ? null : option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 50 : 'auto' }}>
      {label && (
        <label className="mb-2 block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 rounded-xl border-2 border-border-light dark:border-border-dark 
          bg-card-light dark:bg-card-dark px-4 py-3 text-left transition-all duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-primary/50 dark:hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 cursor-pointer'
          }
          ${isOpen ? 'border-primary ring-4 ring-primary/20' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="text-lg flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div 
          ref={menuRef}
          className="absolute z-[100] w-full top-full mt-1 bg-card-light dark:bg-card-dark border-2 border-border-light dark:border-border-dark rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
        >
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150
                ${option.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-primary/10 dark:hover:bg-primary/30 cursor-pointer'
                }
                ${value === option.value 
                  ? 'bg-primary/20 dark:bg-primary/50 border-l-4 border-primary' 
                  : ''
                }
              `}
            >
              {option.icon && (
                <span className="text-lg flex-shrink-0">{option.icon}</span>
              )}
              <span className={`text-sm font-medium ${
                value === option.value
                  ? 'text-primary dark:text-white'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`}>
                {option.label}
              </span>
              {value === option.value && (
                <span className="ml-auto text-primary dark:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

