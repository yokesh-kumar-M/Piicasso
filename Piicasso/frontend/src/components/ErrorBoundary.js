import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-dark-bg flex min-h-screen items-center justify-center p-8 text-white">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-600 bg-red-900/20">
              <AlertTriangle className="text-neon-green h-10 w-10" />
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-wide">Something went wrong</h1>
            <p className="mb-8 text-sm text-zinc-500">
              An unexpected error occurred. This has been logged for investigation.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 max-h-48 overflow-auto rounded border border-zinc-800 bg-black p-4 text-left">
                <p className="break-all font-mono text-xs text-red-400">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="bg-neon-green flex items-center gap-2 rounded px-6 py-3 text-sm font-bold transition-colors hover:bg-[#00cc00]"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold transition-colors hover:bg-zinc-700"
              >
                <RefreshCw className="h-4 w-4" /> Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold transition-colors hover:bg-zinc-700"
              >
                <Home className="h-4 w-4" /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
