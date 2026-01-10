import { Component, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  rawContent?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showRaw: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showRaw: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleToggleRaw = () => {
    this.setState(prev => ({ showRaw: !prev.showRaw }));
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showRaw: false });
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong', rawContent } = this.props;
      const { error, showRaw } = this.state;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h3 className="error-title">{fallbackTitle}</h3>
            <p className="error-message">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-actions">
              <button className="secondary" onClick={this.handleRetry}>
                Retry
              </button>
              {rawContent && (
                <button className="secondary" onClick={this.handleToggleRaw}>
                  {showRaw ? 'Hide Raw Data' : 'Show Raw Data'}
                </button>
              )}
            </div>
            {showRaw && rawContent && (
              <div className="error-raw">
                <pre className="mono">{rawContent}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
