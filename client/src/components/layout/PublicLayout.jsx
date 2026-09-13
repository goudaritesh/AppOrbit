import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BetaBanner from '../common/BetaBanner';
import BetaWelcomeModal from '../common/BetaWelcomeModal';

/**
 * Public Layout Wrapper
 * Standard shell for consumer-facing marketplace views.
 */
export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <BetaBanner />
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <BetaWelcomeModal />
    </div>
  );
};

export default PublicLayout;
