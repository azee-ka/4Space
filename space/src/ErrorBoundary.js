import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      // Customize the error UI here
      return (
        <div>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.info ? (
              <>
                <summary>Click for details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.info.componentStack}</pre>
              </>
            ) : null}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
