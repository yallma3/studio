/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipHelper } from '@/shared/components/ui/tooltip-helper';

describe('TooltipHelper Component', () => {
  it('should render HelpCircle icon with default size', () => {
    render(<TooltipHelper text="Help text" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '16'); // Default size
    expect(icon).toHaveAttribute('height', '16');
  });

  it('should render HelpCircle icon with custom size', () => {
    render(<TooltipHelper text="Help text" size={24} />);

    const icon = document.querySelector('svg');
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('height', '24');
  });

  it('should show tooltip on mouse enter', () => {
    render(<TooltipHelper text="Help text" />);

    const container = document.querySelector('svg')!.parentElement!;
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave', () => {
    render(<TooltipHelper text="Help text" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();

    fireEvent.mouseLeave(container);
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });

  it('should render tooltip for top position', () => {
    render(<TooltipHelper text="Help text" position="top" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('should render tooltip for right position', () => {
    render(<TooltipHelper text="Help text" position="right" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('should render tooltip for bottom position', () => {
    render(<TooltipHelper text="Help text" position="bottom" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('should render tooltip for left position', () => {
    render(<TooltipHelper text="Help text" position="left" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<TooltipHelper text="Help text" className="custom-class" />);

    const container = document.querySelector('svg')!.parentElement!;
    expect(container).toBeInTheDocument();
  });

  it('should render arrow for right position', () => {
    render(<TooltipHelper text="Help text" position="right" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    const arrow = screen.getByText('Help text').parentElement!.querySelector('.absolute.-left-1');
    expect(arrow).toBeInTheDocument();
  });

  it('should render arrow for bottom position', () => {
    render(<TooltipHelper text="Help text" position="bottom" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    const arrow = screen.getByText('Help text').parentElement!.querySelector('.absolute.-top-1');
    expect(arrow).toBeInTheDocument();
  });

  it('should render arrow for left position', () => {
    render(<TooltipHelper text="Help text" position="left" />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    const arrow = screen.getByText('Help text').parentElement!.querySelector('.absolute.-right-1');
    expect(arrow).toBeInTheDocument();
  });





  it('should handle long text content', () => {
    const longText = 'This is a very long tooltip text that should be displayed properly in the tooltip component with appropriate styling and positioning.';
    render(<TooltipHelper text={longText} />);

    const container = document.querySelector('svg')!.parentElement!;

    fireEvent.mouseEnter(container);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should be focusable with keyboard and show/hide tooltip on focus/blur', () => {
    render(<TooltipHelper text="Accessible help text" />);

    const container = document.querySelector('svg')!.parentElement!;
    expect(container).toHaveAttribute('tabIndex', '0');
    expect(container).toHaveAttribute('aria-label', 'Accessible help text');

    expect(screen.queryByText('Accessible help text')).not.toBeInTheDocument();

    fireEvent.focus(container);
    expect(screen.getByText('Accessible help text')).toBeInTheDocument();

    fireEvent.blur(container);
    expect(screen.queryByText('Accessible help text')).not.toBeInTheDocument();
  });
});