import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard Application Error Boundary
 * Catches unhandled render errors, preventing white screens and offering recovery actions.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ResQWave Uncaught Component Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="surface-z2 border border-[var(--border-strong)] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {this.props.fallbackTitle || 'Something Went Wrong'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {this.props.fallbackMessage ||
                  this.state.error?.message ||
                  'An unexpected interface error occurred. You can retry the component or reload.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReload}
                className="text-xs"
              >
                Reload Page
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-3.5 h-3.5" />}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
