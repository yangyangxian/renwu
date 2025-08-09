import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from '@/components/ui-kit/Sonner';
import { MilkdownProvider } from '@milkdown/react';
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react';

const rootElement = document.getElementById('root') as HTMLElement;
createRoot(rootElement).render(
  <StrictMode>  
      <BrowserRouter>
          <Toaster position="top-center" richColors closeButton />
          <AuthProvider>
            <MilkdownProvider>
              <ProsemirrorAdapterProvider>            
                <App />
            </ProsemirrorAdapterProvider>
            </MilkdownProvider>
          </AuthProvider>
      </BrowserRouter>
  </StrictMode>
);
