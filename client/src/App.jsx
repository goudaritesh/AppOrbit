import React from 'react';
import AppRoutes from './routes/AppRoutes';
import AuthInitializer from './components/common/AuthInitializer';
import { SocketProvider } from './context/SocketContext';

export const App = () => {
  return (
    <AuthInitializer>
      <SocketProvider>
        <div className="min-h-screen bg-background text-content-primary">
          <AppRoutes />
        </div>
      </SocketProvider>
    </AuthInitializer>
  );
};

export default App;
