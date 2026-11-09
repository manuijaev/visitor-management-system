import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ViewToggle from './ViewToggle';

describe('ViewToggle', () => {
  it('marks the current layout and switches on click', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="list" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'List view' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Card view' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Card view' }));
    expect(onChange).toHaveBeenCalledWith('grid');
  });
});
