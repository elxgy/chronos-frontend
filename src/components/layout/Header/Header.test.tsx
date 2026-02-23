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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('copies room code using Clipboard API when available', async () => {
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

    fireEvent.click(screen.getByTitle('Copy room code'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ABC123');
      expect(screen.getByTitle('Copy room code').querySelector('svg')).not.toBeNull();
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

    fireEvent.click(screen.getByTitle('Copy room code'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('DEF456');
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

    fireEvent.click(screen.getByTitle('Copy room code'));

    await waitFor(() => {
      expect(screen.getByTitle('Copy failed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });
});
