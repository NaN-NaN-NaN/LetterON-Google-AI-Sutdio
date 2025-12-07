import  React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Chip from './Chip';

describe('Chip', () => {
  it('renders the chip with the correct text', () => {
    render(<Chip onRemove={() => {}}>Test Chip</Chip>);
    const chip = screen.getByText(/Test Chip/i);
    expect(chip).toBeInTheDocument();
  });

  it('calls the onRemove function when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Test Chip</Chip>);
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
