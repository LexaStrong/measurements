import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'

console.log("Main.tsx: App starting...");

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    console.error("ErrorBoundary caught:", error);
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#1E1A18', color: '#E8E2D9', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#C9A96E' }}>Lemaire Atelier: Crash Detected</h1>
          <p>The application encountered a runtime error:</p>
          <pre style={{ 
            background: '#2A2624', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #3D3834',
            color: '#FF6B6B',
            overflow: 'auto'
          }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            background: '#C9A96E',
            color: '#1E1A18',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const isPlaceholder = (key: string | undefined) => {
  return !key || key.includes("your_") || key.includes("_here") || key === "pk_test_placeholder";
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (isPlaceholder(PUBLISHABLE_KEY)) {
  root.render(
    <div style={{ 
      padding: '40px', 
      background: '#1E1A18', 
      color: '#E8E2D9', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>✂️</div>
      <h1 style={{ color: '#C9A96E', fontSize: '32px', marginBottom: '16px' }}>Configuration Required</h1>
      <p style={{ maxWidth: '400px', color: '#6B6560', lineHeight: '1.6', marginBottom: '32px' }}>
        Please update your <strong>.env</strong> file with a valid <strong>Clerk Publishable Key</strong> to enable authentication and sync.
      </p>
      <div style={{ 
        background: '#2A2624', 
        padding: '20px', 
        borderRadius: '16px', 
        border: '1px solid #3D3834',
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#C9A96E'
      }}>
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
      </div>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
}
