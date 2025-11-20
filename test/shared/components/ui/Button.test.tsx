/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/shared/components/ui/button';

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply default variant classes', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-yellow-400', 'hover:bg-yellow-500', 'text-gray-900');
  });

  it('should apply outline variant classes', () => {
    render(<Button variant="outline">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-800/50', 'hover:bg-gray-800', 'text-white', 'border-yellow-400/30');
  });

  it('should apply default size classes', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'px-4');
  });

  it('should apply large size classes', () => {
    render(<Button size="lg">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-14', 'text-lg', 'px-6');
  });

  it('should apply small size classes', () => {
    render(<Button size="sm">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'px-3', 'text-sm');
  });

  it('should apply disabled classes and attributes', () => {
    render(<Button disabled>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render with gap and items-center for icon support', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('should render as a button element', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
  });

  it('should handle complex children', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});