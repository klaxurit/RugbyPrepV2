import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F2EE] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-[#7B0D1E]/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-lg font-black text-[#1a100c] mb-2">
            Quelque chose a coincé
          </h1>
          <p className="text-sm text-[#1a100c]/60 mb-6 max-w-xs">
            Recharge la page pour repartir. Si le problème persiste, écris-nous à bonjour@rugbyforge.fr.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-[#7B0D1E] text-white text-sm font-bold"
          >
            Recharger
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
