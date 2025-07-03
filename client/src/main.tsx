import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from '@/components/ui-kit/Sonner';

const rootElement = document.getElementById('root') as HTMLElement;
createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <>
          <Toaster position="top-center" richColors closeButton />
          <App />
        </>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
