import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  helpText?: string;
}

// Define custom scrollbar styles as a CSS class
// We'll add this to index.css or a global stylesheet

const Select: React.FC<SelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  label,
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find the selected option
  const selectedOption = options.find(option => option.value === value);
  
  // Close dropdown when clicking outside and determine dropdown position
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const determineDropPosition = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // Approximate max height of dropdown
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropPosition('top');
      } else {
        setDropPosition('bottom');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', determineDropPosition);
    
    // Determine position when opening
    if (isOpen) {
      determineDropPosition();
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', determineDropPosition);
    };
  }, [isOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex !== null) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(prev => !prev);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          let newIndex = highlightedIndex === null ? 0 : highlightedIndex + 1;
          if (newIndex >= options.length) newIndex = 0;
          setHighlightedIndex(newIndex);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          let newIndex = highlightedIndex === null ? options.length - 1 : highlightedIndex - 1;
          if (newIndex < 0) newIndex = options.length - 1;
          setHighlightedIndex(newIndex);
        }
        break;
    }
  };
  
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div 
        ref={containerRef}
        className={`relative ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className={`flex items-center justify-between w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-150 ${isOpen ? 'border-zinc-600' : ''} ${className}`}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
        >
          <span className={`${!selectedOption ? 'text-gray-400' : 'text-white'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {isOpen && !disabled && (
          <div 
            className={`absolute z-50 w-full ${dropPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-zinc-800/95 border border-zinc-700 rounded-md shadow-xl drop-shadow-lg max-h-60 overflow-auto backdrop-blur-sm animate-dropdown custom-scrollbar`}
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
            }}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer transition-colors duration-150 ${
                  option.disabled 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : highlightedIndex === index 
                      ? 'bg-yellow-500/10 text-white' 
                      : 'text-white hover:bg-zinc-700/40'
                } ${option.value === value ? 'bg-yellow-500/5 font-medium' : ''}`}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {helpText && (
        <p className="text-xs text-gray-400 mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default Select;
