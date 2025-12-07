import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders the button with the correct text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
  });

  it('applies the correct classes for the primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button', { name: /Primary/i });
    expect(button).toHaveClass('bg-primary');
  });

  it('applies the correct classes for the secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /Secondary/i });
    expect(button).toHaveClass('bg-secondary');
  });

  it('applies the correct classes for the ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button', { name: /Ghost/i });
    expect(button).toHaveClass('bg-transparent');
  });

  it('applies the correct classes for the danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button', { name: /Danger/i });
    expect(button).toHaveClass('bg-red-500');
  });

  it('applies the correct classes for the small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button', { name: /Small/i });
    expect(button).toHaveClass('text-sm');
  });

  it('applies the correct classes for the medium size', () => {
    render(<Button size="md">Medium</Button>);
    const button = screen.getByRole('button', { name: /Medium/i });
    expect(button).toHaveClass('text-base');
  });

  it('applies the correct classes for the large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button', { name: /Large/i });
    expect(button).toHaveClass('text-lg');
  });
});
