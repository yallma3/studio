/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '@/shared/components/ui/LanguageSelector';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  })),
}));

import { useTranslation } from 'react-i18next';

describe('LanguageSelector Component', () => {
  const mockUseTranslation = vi.mocked(useTranslation);
  const mockChangeLanguage = vi.fn();

  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset document attributes
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  it('should render language selector buttons', () => {
    render(<LanguageSelector />);

    expect(screen.getByText('common.english')).toBeInTheDocument();
    expect(screen.getByText('common.arabic')).toBeInTheDocument();
  });

  it('should set document direction and language on mount for English', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
    } as any);

    render(<LanguageSelector />);

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should set document direction and language on mount for Arabic', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'ar',
        changeLanguage: mockChangeLanguage,
      },
    } as any);

    render(<LanguageSelector />);

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('should update document attributes when language changes', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
    } as any);

    const { rerender } = render(<LanguageSelector />);

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');

    // Simulate language change
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'ar',
        changeLanguage: mockChangeLanguage,
      },
    } as any);
    rerender(<LanguageSelector />);

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('should call changeLanguage when English button is clicked', () => {
    render(<LanguageSelector />);

    const englishButton = screen.getByText('common.english');
    fireEvent.click(englishButton);

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('should call changeLanguage when Arabic button is clicked', () => {
    render(<LanguageSelector />);

    const arabicButton = screen.getByText('common.arabic');
    fireEvent.click(arabicButton);

    expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
  });

  it('should apply correct styling for active language (English)', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
    } as any);

    render(<LanguageSelector />);

    const englishButton = screen.getByText('common.english');
    const arabicButton = screen.getByText('common.arabic');

    expect(englishButton).toHaveClass('bg-zinc-800', 'text-white', 'rounded-l-md');
    expect(arabicButton).toHaveClass('text-gray-300', 'cursor-pointer', 'hover:bg-zinc-700', 'rounded-r-md');
  });

  it('should apply correct styling for active language (Arabic)', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'ar',
        changeLanguage: mockChangeLanguage,
      },
    } as any);

    render(<LanguageSelector />);

    const englishButton = screen.getByText('common.english');
    const arabicButton = screen.getByText('common.arabic');

    expect(arabicButton).toHaveClass('bg-zinc-800', 'text-white', 'rounded-l-md');
    expect(englishButton).toHaveClass('text-gray-300', 'cursor-pointer', 'hover:bg-zinc-700', 'rounded-r-md');
  });

  it('should have proper accessibility attributes', () => {
    render(<LanguageSelector />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });
});