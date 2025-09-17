'use client'

import React, { Component, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { reportError } from '@/lib/monitoring'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      errorId: this.state.errorId
    })

    // Report to monitoring service (placeholder)
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary()
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  retryWithDelay = () => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary()
    }, 1000)
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // Report to monitoring service
    reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      severity: 'high',
      context: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack || undefined,
        type: 'component-error'
      }
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-red-900">
                Something went wrong
              </h3>
            </div>

            <p className="text-red-700 text-sm mb-4">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-100 rounded border border-red-200">
                <p className="text-xs font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.resetErrorBoundary}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-xs text-red-600">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Caught error:', error, errorInfo)

    // Report to monitoring service
    reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      severity: 'medium',
      context: {
        type: 'hook-error',
        componentStack: errorInfo?.componentStack
      }
    })
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default ErrorBoundary