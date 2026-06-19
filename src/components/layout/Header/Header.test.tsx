import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

describe('Header copy button', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('copies join URL using Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <MemoryRouter>
        <Header roomCode="ABC123" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Copy room link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('http://localhost:5173/join/ABC123');
      expect(screen.getByTitle('Copy room link').querySelector('svg')).not.toBeNull();
    });
  });

  it('falls back to execCommand when Clipboard API write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const execSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execSpy,
    });

    render(
      <MemoryRouter>
        <Header roomCode="DEF456" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Copy room link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('http://localhost:5173/join/DEF456');
      expect(execSpy).toHaveBeenCalledWith('copy');
    });
  });

  it('shows failure feedback when both Clipboard API and fallback fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });

    render(
      <MemoryRouter>
        <Header roomCode="GHI789" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Copy room link'));

    await waitFor(() => {
      expect(screen.getByTitle('Copy failed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });
});

describe('Header back button', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders back button when showBack is true', () => {
    render(
      <MemoryRouter>
        <Header showBack onBack={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('does not render back button when showBack is false', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <Header showBack onBack={onBack} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('Header participant count', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows participant count with green dot indicator', () => {
    render(
      <MemoryRouter>
        <Header participantCount={5} />
      </MemoryRouter>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    const container = screen.getByText('5').closest('div');
    expect(container?.querySelector('.bg-green-500')).toBeInTheDocument();
  });
});
