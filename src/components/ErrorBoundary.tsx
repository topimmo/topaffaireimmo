import { Component, ErrorInfo, ReactNode } from 'react'
import { isDev } from '@/lib/env'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h1 className="text-xl font-semibold">Something went wrong</h1>
            </div>
            
            <p className="text-muted-foreground mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {this.state.error && isDev() && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
