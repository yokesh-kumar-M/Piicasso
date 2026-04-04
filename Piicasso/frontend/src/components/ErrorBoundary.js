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
        <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-red-900/20 border border-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-neon-green" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2 tracking-wide">Something went wrong</h1>
            <p className="text-zinc-500 text-sm mb-8">
              An unexpected error occurred. This has been logged for investigation.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-black border border-zinc-800 rounded p-4 mb-8 text-left overflow-auto max-h-48">
                <p className="text-red-400 text-xs font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={this.handleReset}
                className="bg-neon-green hover:bg-[#00cc00] px-6 py-3 rounded font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded font-bold text-sm flex items-center gap-2 transition-colors border border-zinc-700"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded font-bold text-sm flex items-center gap-2 transition-colors border border-zinc-700"
              >
                <Home className="w-4 h-4" /> Go Home
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
