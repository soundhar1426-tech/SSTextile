import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.state = { hasError: true, error, errorInfo };
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gtex_mill_settings');
      localStorage.removeItem('gtex_discount_settings');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1C1A] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-[#C5C6CE] p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl font-bold">warning</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#000412]">Something went wrong</h1>
              <p className="text-sm text-[#44474D]">
                An unexpected application error occurred while rendering this page.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#F4F3F0] p-3 rounded-lg border border-[#E2DDD5] text-xs font-mono text-[#BA1A1A] overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#0F1E36] hover:bg-[#000412] text-white rounded-lg text-sm font-bold shadow transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#EFEEEB] hover:bg-[#E9E8E5] text-[#000412] border border-[#C5C6CE] rounded-lg text-sm font-bold transition-colors cursor-pointer"
              >
                Clear Cache &amp; Home
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
