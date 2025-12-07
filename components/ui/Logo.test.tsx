import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo', () => {
  it('renders the logo with the correct text', () => {
    render(<Logo />);
    const text = screen.getByText(/LetterOn/i);
    expect(text).toBeInTheDocument();
  });

  it('renders the svg logo', () => {
    render(<Logo />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
