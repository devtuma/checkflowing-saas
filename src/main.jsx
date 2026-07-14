import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { TenantProvider } from '@/hooks/useTenant.jsx';
import { TrialProvider } from '@/hooks/useTrial.jsx';
import { BrandingProvider } from '@/providers/BrandingProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <TrialProvider>
            <BrandingProvider>
              <App />
              <Toaster />
            </BrandingProvider>
          </TrialProvider>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>
  </>
);