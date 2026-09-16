import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nimadir xato ketdi
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Kutilmagan texnik xatolik yuz berdi. Sahifani qayta yuklang yoki bosh sahifaga qayting.
          </p>
          {this.state.error && (
            <div className="mt-4 max-w-lg overflow-x-auto rounded-lg bg-gray-100 p-3 text-left font-mono text-xs text-red-600 dark:bg-gray-800 dark:text-red-400">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              Sahifani qayta yuklash
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              Bosh sahifaga qaytish
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
