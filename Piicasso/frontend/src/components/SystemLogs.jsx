import React, { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../api/axios';

const POLL_INTERVAL_MS = 30000;

const stateContent = {
  loading: {
    title: 'Loading system logs',
    detail: 'Requesting the administrator audit feed.',
  },
  empty: {
    title: 'No system logs reported',
    detail: 'The server returned an empty audit feed.',
  },
  permission: {
    title: 'Administrator access required',
    detail: 'System logs are restricted. No telemetry is being displayed.',
  },
  error: {
    title: 'System logs unavailable',
    detail: 'The audit feed could not be reached. No system status can be inferred.',
  },
};

const LogState = ({ state, onRetry }) => {
  const content = stateContent[state];

  return (
    <div
      className="flex h-full min-h-20 flex-col items-center justify-center gap-1 px-4 text-center font-mono"
      role={state === 'error' ? 'alert' : 'status'}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
        {content.title}
      </span>
      <span className="max-w-lg text-[9px] leading-relaxed text-zinc-500">{content.detail}</span>
      {state === 'error' && (
        <button
          type="button"
          className="mt-2 rounded border border-zinc-700 px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
};

const SystemLogs = ({ enabled = true, onStatusChange }) => {
  const [logs, setLogs] = useState([]);
  const [requestState, setRequestState] = useState(enabled ? 'loading' : 'permission');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const logsEndRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let pollTimer;
    let activeController;

    const publishState = (nextState) => {
      if (disposed) return;
      setRequestState(nextState);
      onStatusChange?.(nextState);
    };

    if (!enabled) {
      setLogs([]);
      publishState('permission');
      return () => {
        disposed = true;
      };
    }

    setLogs([]);
    publishState('loading');

    const scheduleNextPoll = (fetchLogs) => {
      pollTimer = window.setTimeout(fetchLogs, POLL_INTERVAL_MS);
    };

    const fetchLogs = async () => {
      activeController = new AbortController();

      try {
        const response = await axiosInstance.get('system/logs/', {
          signal: activeController.signal,
        });
        if (disposed) return;
        if (!Array.isArray(response.data)) {
          throw new Error('System log response was not a list.');
        }

        setLogs(response.data);
        publishState(response.data.length > 0 ? 'success' : 'empty');

        // Schedule only after the current request completes, so slow requests
        // cannot overlap and create an unbounded polling queue.
        scheduleNextPoll(fetchLogs);
      } catch (error) {
        if (disposed || activeController.signal.aborted) return;

        setLogs([]);
        const status = error.response?.status;
        publishState(status === 401 || status === 403 ? 'permission' : 'error');
        // Permission and network failures stop polling. A user-controlled retry
        // is available for transport failures.
      }
    };

    fetchLogs();

    return () => {
      disposed = true;
      window.clearTimeout(pollTimer);
      activeController?.abort();
    };
  }, [enabled, onStatusChange, retryAttempt]);

  // The backend returns newest-first; reverse the bounded result for a natural
  // terminal timeline with the latest event at the bottom.
  const displayLogs = useMemo(() => logs.slice(0, 50).reverse(), [logs]);

  useEffect(() => {
    if (requestState === 'success' && logsEndRef.current?.parentNode) {
      logsEndRef.current.parentNode.scrollTop = logsEndRef.current.parentNode.scrollHeight;
    }
  }, [displayLogs, requestState]);

  if (requestState !== 'success') {
    return (
      <div className="h-full overflow-hidden rounded-sm border border-zinc-900/50 bg-black/40">
        <LogState state={requestState} onRetry={() => setRetryAttempt((attempt) => attempt + 1)} />
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-zinc-900/50 bg-black/40 font-mono text-[10px] md:text-xs">
      <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto p-2">
        <div className="space-y-1" aria-label="System log entries">
          {displayLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${log.source}-${log.level}-${index}`}
              className="flex gap-2 opacity-90 transition-opacity hover:opacity-100"
            >
              <span className="shrink-0 text-zinc-600">[{log.timestamp}]</span>
              <span
                className={`w-12 shrink-0 font-bold ${
                  log.level === 'CRITICAL'
                    ? 'text-red-600'
                    : log.level === 'ERROR'
                      ? 'text-red-400'
                      : log.level === 'WARNING'
                        ? 'text-yellow-500'
                        : log.level === 'SUCCESS'
                          ? 'text-green-500'
                          : 'text-blue-500'
                }`}
              >
                {log.level}
              </span>
              <span className="truncate font-mono text-gray-300">
                [{log.source}] {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
