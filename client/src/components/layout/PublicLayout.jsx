import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Public Layout Wrapper
 * Standard shell for consumer-facing marketplace views.
 */
export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
