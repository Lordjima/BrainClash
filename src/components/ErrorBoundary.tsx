// @ts-nocheck
import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: '#09090b' }}
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Oups ! Quelque chose s'est mal passé.</h1>
          <p className="text-zinc-400 mb-8 max-w-md">
            L'application a rencontré une erreur inattendue. Veuillez rafraîchir la page ou revenir à l'accueil.
          </p>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-8 text-left max-w-2xl overflow-auto">
            <p className="text-red-400 font-mono text-sm">
              {this.state.error?.toString()}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
