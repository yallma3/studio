/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventResultDialog from '@/modules/workspace/components/EventResultDialog';
import { ConsoleEvent } from '@/modules/workspace/types/Types';

describe('EventResultDialog Component', () => {
  const mockOnClose = vi.fn();

  const mockEvent: ConsoleEvent = {
    id: 'test-event-123456789',
    timestamp: 1640995200000, // 2022-01-01 00:00:00
    type: 'info',
    message: 'Test message',
    results: 'Test results content\nwith multiple lines',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <EventResultDialog isOpen={false} onClose={mockOnClose} event={mockEvent} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should not render when event is null', () => {
    const { container } = render(
      <EventResultDialog isOpen={true} onClose={mockOnClose} event={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should not render when event.results is empty', () => {
    const eventWithoutResults = { ...mockEvent, results: '' };
    const { container } = render(
      <EventResultDialog isOpen={true} onClose={mockOnClose} event={eventWithoutResults} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should not render when event.results is undefined', () => {
    const eventWithoutResults = { ...mockEvent, results: undefined };
    const { container } = render(
      <EventResultDialog isOpen={true} onClose={mockOnClose} event={eventWithoutResults} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog with event details when all conditions are met', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByTitle('test-event-123456789')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();

    // Check that results are displayed
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveTextContent('Test results content');
    expect(preElement).toHaveTextContent('with multiple lines');
  });

  it('should display formatted timestamp', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    // The timestamp should be formatted as a locale string
    const timestampElement = screen.getByText(/1\/1\/2022/);
    expect(timestampElement).toBeInTheDocument();
  });

  it('should display event type with correct color for info', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    const typeElement = screen.getByText('INFO');
    expect(typeElement).toHaveClass('text-blue-400');
  });

  it('should display event type with correct color for error', () => {
    const errorEvent = { ...mockEvent, type: 'error' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={errorEvent} />);

    const typeElement = screen.getByText('ERROR');
    expect(typeElement).toHaveClass('text-red-400');
  });

  it('should display event type with correct color for warning', () => {
    const warningEvent = { ...mockEvent, type: 'warning' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={warningEvent} />);

    const typeElement = screen.getByText('WARNING');
    expect(typeElement).toHaveClass('text-yellow-400');
  });

  it('should display event type with correct color for success', () => {
    const successEvent = { ...mockEvent, type: 'success' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={successEvent} />);

    const typeElement = screen.getByText('SUCCESS');
    expect(typeElement).toHaveClass('text-green-400');
  });

  it('should display event type with correct color for system', () => {
    const systemEvent = { ...mockEvent, type: 'system' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={systemEvent} />);

    const typeElement = screen.getByText('SYSTEM');
    expect(typeElement).toHaveClass('text-[#9CA3AF]');
  });

  it('should display event type with correct color for input', () => {
    const inputEvent = { ...mockEvent, type: 'input' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={inputEvent} />);

    const typeElement = screen.getByText('INPUT');
    expect(typeElement).toHaveClass('text-[#06B6D4]');
  });

  it('should display event type with correct color for user', () => {
    const userEvent = { ...mockEvent, type: 'user' as const };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={userEvent} />);

    const typeElement = screen.getByText('USER');
    expect(typeElement).toHaveClass('text-[#8B5CF6]');
  });

  it('should display event type with default color for unknown type', () => {
    const unknownEvent = { ...mockEvent, type: 'unknown' as any };
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={unknownEvent} />);

    const typeElement = screen.getByText('UNKNOWN');
    expect(typeElement).toHaveClass('text-blue-400');
  });

  it('should display truncated event ID', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    const titleElement = screen.getByTitle('test-event-123456789');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('• test-eve');
  });

  it('should display results in pre-formatted text', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveTextContent('Test results content');
    expect(preElement).toHaveTextContent('with multiple lines');
  });

  it('should call onClose when close button is clicked', () => {
    render(<EventResultDialog isOpen={true} onClose={mockOnClose} event={mockEvent} />);

    const closeButton = screen.getByTitle('Close');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});