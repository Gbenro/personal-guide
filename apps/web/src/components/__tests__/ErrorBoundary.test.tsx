import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, useErrorHandler, withErrorBoundary } from '../ErrorBoundary'
import * as monitoring from '@/lib/monitoring'

// Mock the monitoring module
jest.mock('@/lib/monitoring')

const mockReportError = monitoring.reportError as jest.MockedFunction<typeof monitoring.reportError>

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Test component for useErrorHandler hook
const TestErrorHandler = () => {
  const handleError = useErrorHandler()

  const triggerError = () => {
    handleError(new Error('Hook error'), { componentStack: 'Test stack' })
  }

  return <button onClick={triggerError}>Trigger Error</button>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('ErrorBoundary component', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render error UI when there is an error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Reload Page')).toBeInTheDocument()
    })

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should report error to monitoring service', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(mockReportError).toHaveBeenCalledWith({
        message: 'Test error',
        stack: expect.any(String),
        componentStack: expect.any(String),
        severity: 'high',
        context: {
          errorId: expect.any(String),
          componentStack: expect.any(String),
          type: 'component-error'
        }
      })
    })

    it('should reset when Try Again button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Try Again'))

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should reload page when Reload Page button is clicked', () => {
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByText('Reload Page'))

      expect(mockReload).toHaveBeenCalled()
    })

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should reset when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Change resetKeys to trigger reset
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Test error')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('should show error ID in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('useErrorHandler hook', () => {
    it('should report errors when called', () => {
      render(<TestErrorHandler />)

      fireEvent.click(screen.getByText('Trigger Error'))

      expect(mockReportError).toHaveBeenCalledWith({
        message: 'Hook error',
        stack: expect.any(String),
        componentStack: 'Test stack',
        severity: 'medium',
        context: {
          type: 'hook-error',
          componentStack: 'Test stack'
        }
      })
    })

    it('should handle errors without errorInfo', () => {
      const TestComponent = () => {
        const handleError = useErrorHandler()

        const triggerError = () => {
          handleError(new Error('Simple hook error'))
        }

        return <button onClick={triggerError}>Trigger Simple Error</button>
      }

      render(<TestComponent />)

      fireEvent.click(screen.getByText('Trigger Simple Error'))

      expect(mockReportError).toHaveBeenCalledWith({
        message: 'Simple hook error',
        stack: expect.any(String),
        componentStack: undefined,
        severity: 'medium',
        context: {
          type: 'hook-error',
          componentStack: undefined
        }
      })
    })
  })

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('HOC error')
        }
        return <div>HOC wrapped content</div>
      }

      const WrappedComponent = withErrorBoundary(TestComponent)

      render(<WrappedComponent shouldThrow={false} />)

      expect(screen.getByText('HOC wrapped content')).toBeInTheDocument()
    })

    it('should catch errors in wrapped component', () => {
      const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('HOC error')
        }
        return <div>HOC wrapped content</div>
      }

      const WrappedComponent = withErrorBoundary(TestComponent)

      render(<WrappedComponent shouldThrow={true} />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should pass error boundary props to HOC', () => {
      const TestComponent = () => <div>Test</div>
      const onError = jest.fn()

      const WrappedComponent = withErrorBoundary(TestComponent, {
        onError,
        fallback: <div>Custom HOC fallback</div>
      })

      render(<WrappedComponent />)

      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should set correct display name', () => {
      const TestComponent = () => <div>Test</div>
      TestComponent.displayName = 'TestComponent'

      const WrappedComponent = withErrorBoundary(TestComponent)

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
    })

    it('should handle component without display name', () => {
      const TestComponent = () => <div>Test</div>

      const WrappedComponent = withErrorBoundary(TestComponent)

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
    })
  })

  describe('error boundary lifecycle', () => {
    it('should handle multiple errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(mockReportError).toHaveBeenCalledTimes(1)

      // Reset and trigger another error
      fireEvent.click(screen.getByText('Try Again'))

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(mockReportError).toHaveBeenCalledTimes(2)
    })

    it('should handle component updates after error', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Update props but don't reset
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Should still show error until explicitly reset
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })
})