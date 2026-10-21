/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
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
  size?: 'sm' | 'md';
  /** Accessible name when a visible `label` is rendered elsewhere. */
  ariaLabel?: string;
}

// Gap between the trigger and the floating option list (px).
const MENU_GAP = 4;
// Matches `max-h-60` (15rem) on the option list.
const MENU_MAX_HEIGHT = 240;

const sizeClasses: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
};

interface MenuRect {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

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
  size = 'sm',
  ariaLabel,
}) => {
  // Wire the trigger and popup to the label with stable ids so the control is
  // programmatically labelled and exposes combobox/listbox semantics.
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const labelId = `${selectId}-label`;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Find the selected option
  const selectedOption = options.find(option => option.value === value);

  // Position the floating list against the trigger. The list is portalled to
  // `document.body` so a scrolling/overflow ancestor can never clip it.
  const updateMenuPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const approxHeight = Math.min(MENU_MAX_HEIGHT, options.length * 40 + 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < approxHeight && rect.top > spaceBelow;
    setMenuRect({
      top: openUp ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [options.length]);

  const openMenu = () => {
    updateMenuPosition();
    setIsOpen(true);
  };

  // Reposition while open and close on outside interaction.
  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    // Capture so nested scroll containers also reposition the list.
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updateMenuPosition]);

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
        } else if (isOpen) {
          setIsOpen(false);
        } else {
          openMenu();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          let newIndex = highlightedIndex === null ? 0 : highlightedIndex + 1;
          if (newIndex >= options.length) newIndex = 0;
          setHighlightedIndex(newIndex);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openMenu();
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
        <label id={labelId} htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div
        ref={containerRef}
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-disabled={disabled || undefined}
        className={`relative ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className={`flex items-center justify-between w-full ${sizeClasses[size]} bg-zinc-800 border border-zinc-700 rounded-md text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-150 ${isOpen ? 'border-zinc-600' : ''} ${className}`}
          onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        >
          <span className={`${!selectedOption ? 'text-gray-400' : 'text-white'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && !disabled && menuRect && createPortal(
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : selectId}
          className="fixed z-[1000] bg-zinc-800/95 border border-zinc-700 rounded-md shadow-xl drop-shadow-lg max-h-60 overflow-auto backdrop-blur-sm animate-dropdown custom-scrollbar"
          // The popup lives in document.body, outside any panel/modal DOM
          // subtree. Stop mousedown bubbling so document-level "click outside"
          // handlers (e.g. NodeEditPanel) don't treat an option click as an
          // outside click and close their container.
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
            transform: menuRect.openUp ? 'translateY(-100%)' : undefined,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          }}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
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
        </div>,
        document.body
      )}

      {helpText && (
        <p className="text-xs text-gray-400 mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default Select;
