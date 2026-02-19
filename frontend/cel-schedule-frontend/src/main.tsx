import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryProvider } from './providers/QueryProvider'
import { testFirebaseConnection } from './utils/testFirebase'

// Make Firebase test available in console for debugging
if (import.meta.env.DEV) {
  (window as any).testFirebase = testFirebaseConnection;
  console.log('🔧 Debug: Run testFirebase() in console to test Firebase connection');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
)
