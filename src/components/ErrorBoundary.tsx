'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-lg w-full text-center">
            <div className="text-4xl mb-4">⚠</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Etwas ist schiefgelaufen</h2>
            <p className="text-slate-500 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Versuche die Seite neu zu laden.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 font-semibold transition-colors"
            >
              Seite neu laden
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-600">
                  Technische Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs text-red-600 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
