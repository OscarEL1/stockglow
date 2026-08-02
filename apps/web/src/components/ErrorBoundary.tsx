import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFF8F9] p-6">
          <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-lg font-bold text-[#2D2A32]">
              Algo salió mal
            </h2>
            <p className="mb-4 text-sm text-[#7A7480]">
              Ha ocurrido un error inesperado. Intenta recargar la página.
            </p>
            <p className="mb-6 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#E85D8C] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d14e7a]"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
