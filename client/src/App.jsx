import React from 'react';
import AppRoutes from './routes/AppRoutes';
import AuthInitializer from './components/common/AuthInitializer';
import { SocketProvider } from './context/SocketContext';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';

export const App = () => {
  return (
    <FirebaseAuthProvider>
      <AuthInitializer>
        <SocketProvider>
          <div className="min-h-screen bg-background text-content-primary">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthInitializer>
    </FirebaseAuthProvider>
  );
};

export default App;
