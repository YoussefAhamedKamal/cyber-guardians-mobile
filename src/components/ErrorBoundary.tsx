import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '16px', padding: '32px',
          color: '#E57373', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ fontSize: '24px', margin: 0 }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: '#888', fontSize: '14px', maxWidth: '400px' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '12px 32px', borderRadius: '12px', border: 'none',
              background: '#4FC3F7', color: '#0a0a1a', fontSize: '16px',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
