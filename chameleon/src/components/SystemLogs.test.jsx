import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import axiosInstance from '../api/axios';
import SystemLogs from './SystemLogs';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('SystemLogs', () => {
  test('renders only logs returned by the real system logs endpoint', async () => {
    let resolveRequest;
    axiosInstance.get.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    render(<SystemLogs />);

    expect(screen.getByText('Loading system logs')).toBeInTheDocument();

    await act(async () => {
      resolveRequest({
        data: [
          {
            timestamp: '14:22:03',
            level: 'SUCCESS',
            source: 'AUTH',
            message: 'Administrator login verified',
          },
          {
            timestamp: '14:20:01',
            level: 'WARNING',
            source: 'POLICY',
            message: 'Policy review required',
          },
        ],
      });
    });

    const entries = await screen.findByLabelText('System log entries');
    expect(within(entries).getByText(/Administrator login verified/)).toBeInTheDocument();
    expect(within(entries).getByText(/Policy review required/)).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('system/logs/', {
      signal: expect.any(AbortSignal),
    });
    expect(screen.queryByText(/packet inspection complete/i)).not.toBeInTheDocument();
  });

  test('shows an explicit empty state for an empty server response', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] });

    render(<SystemLogs />);

    expect(await screen.findByText('No system logs reported')).toBeInTheDocument();
    expect(screen.getByText('The server returned an empty audit feed.')).toBeInTheDocument();
    expect(screen.queryByLabelText('System log entries')).not.toBeInTheDocument();
  });

  test('shows a restricted state and stops polling after a 403', async () => {
    axiosInstance.get.mockRejectedValue({ response: { status: 403 } });

    render(<SystemLogs />);

    expect(await screen.findByText('Administrator access required')).toBeInTheDocument();
    expect(screen.getByText(/no telemetry is being displayed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

    await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledTimes(1));
  });

  test('reports a network failure without inferring status and retries only on request', async () => {
    axiosInstance.get
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ data: [] });

    render(<SystemLogs />);

    expect(await screen.findByRole('alert')).toHaveTextContent('System logs unavailable');
    expect(screen.getByText(/no system status can be inferred/i)).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No system logs reported')).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledTimes(2);
  });

  test('does not request administrator telemetry when access is disabled', async () => {
    render(<SystemLogs enabled={false} />);

    expect(await screen.findByText('Administrator access required')).toBeInTheDocument();
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });
});
