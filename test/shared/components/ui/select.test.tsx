/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '@/shared/components/ui/select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select accessibility', () => {
  it('associates the label with the combobox control', () => {
    render(
      <Select
        id="test-select"
        label="Test Label"
        value="a"
        options={options}
        onChange={() => {}}
      />
    );

    // Label association must resolve to the focusable trigger.
    const control = screen.getByLabelText('Test Label');
    expect(control).toHaveAttribute('role', 'combobox');
    expect(control).toHaveAttribute('id', 'test-select');
  });

  it('exposes expanded state and listbox/option semantics', () => {
    render(
      <Select
        id="test-select"
        label="Test Label"
        value="a"
        options={options}
        onChange={() => {}}
      />
    );

    const control = screen.getByRole('combobox');
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).toHaveAttribute('aria-haspopup', 'listbox');

    fireEvent.click(screen.getByText('Option A'));

    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const renderedOptions = screen.getAllByRole('option');
    expect(renderedOptions).toHaveLength(2);
    expect(renderedOptions[0]).toHaveAttribute('aria-selected', 'true');
    expect(renderedOptions[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('generates an id when none is provided so labels still associate', () => {
    render(
      <Select
        label="Generated Label"
        value="a"
        options={options}
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Generated Label')).toHaveAttribute(
      'role',
      'combobox'
    );
  });

  it('still selects an option on click', () => {
    const onChange = vi.fn();
    render(
      <Select
        id="test-select"
        label="Test Label"
        value="a"
        options={options}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Option A'));
    fireEvent.click(screen.getByText('Option B'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders the option list in a portal so overflow ancestors cannot clip it', () => {
    render(
      <Select
        id="portal-select"
        value="a"
        options={options}
        onChange={() => {}}
      />
    );

    const control = screen.getByRole('combobox');
    fireEvent.click(control.firstElementChild as Element);

    const listbox = screen.getByRole('listbox');
    expect(control.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  it('supports keyboard open, navigate and select', () => {
    const onChange = vi.fn();
    render(
      <Select
        id="kb-select"
        label="KB"
        value="a"
        options={options}
        onChange={onChange}
      />
    );

    const control = screen.getByRole('combobox');
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(control).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(control, { key: 'ArrowDown' });
    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('a');
    expect(control).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape', () => {
    render(
      <Select id="esc-select" value="a" options={options} onChange={() => {}} />
    );

    const control = screen.getByRole('combobox');
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(control).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(control, { key: 'Escape' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies the requested size to the trigger', () => {
    const { rerender } = render(
      <Select id="size-select" value="a" options={options} onChange={() => {}} />
    );

    let trigger = screen.getByRole('combobox').firstElementChild as HTMLElement;
    expect(trigger.className).toContain('px-3');
    expect(trigger.className).toContain('py-2');

    rerender(
      <Select
        id="size-select"
        size="md"
        value="a"
        options={options}
        onChange={() => {}}
      />
    );

    trigger = screen.getByRole('combobox').firstElementChild as HTMLElement;
    expect(trigger.className).toContain('px-4');
    expect(trigger.className).toContain('py-3');
  });
});
