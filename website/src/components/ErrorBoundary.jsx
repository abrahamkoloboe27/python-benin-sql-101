import { Component } from 'react';

/**
 * Attrape toute erreur de rendu React et affiche un message convivial
 * plutôt qu'une page blanche.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          fontFamily: 'system-ui, sans-serif', background: '#f9fafb',
        }}>
          <div style={{
            maxWidth: '480px', textAlign: 'center', background: '#fff',
            borderRadius: '12px', padding: '2rem 2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,.1)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>⚠️</div>
            <h2 style={{ margin: '0 0 .5rem', color: '#111827' }}>
              Une erreur inattendue s'est produite
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'Erreur inconnue'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '.6rem 1.5rem',
                fontSize: '1rem', cursor: 'pointer',
              }}
            >
              🔄 Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
