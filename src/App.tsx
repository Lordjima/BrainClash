/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import Home from './pages/Home';
import HostDashboard from './pages/HostDashboard';
import PlayerScreen from './pages/PlayerScreen';
import Overlay from './pages/Overlay';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import MenuPage from './pages/Menu';
import Leaderboard from './pages/Leaderboard';
import CreateQuiz from './pages/CreateQuiz';
import SubmitQuestion from './pages/SubmitQuestion';
import ReviewQuestions from './pages/ReviewQuestions';
import Auction from './pages/Auction';
import Boutique from './pages/Boutique';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import Navbar from './components/Navbar';
import SpaceBackground from './components/SpaceBackground';
import InventoryBag from './components/InventoryBag';

import { DataProvider, useData } from './DataContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoaded, isLoading, error } = useData();

  if (error) {
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
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-red-500">Erreur de connexion</h1>
        <p className="text-zinc-400 mb-8 max-w-md font-bold uppercase text-xs tracking-widest">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-xl shadow-fuchsia-600/20 uppercase text-sm tracking-widest"
        >
          Rafraîchir la page
        </button>
      </div>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div 
        className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: '#09090b' }}
      >
        <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initialisation du système...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AppContent>
          <SpaceBackground />
          <BrowserRouter>
            <InventoryBag />
            <Routes>
              {/* Overlay doesn't need navbar */}
              <Route path="/overlay/:id" element={<Overlay />} />
              
              {/* All other routes have navbar */}
              <Route path="*" element={
                <div className="h-screen flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-hidden">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/create" element={<CreateQuiz />} />
                      <Route path="/submit-question" element={<SubmitQuestion />} />
                      <Route path="/review-questions" element={<ReviewQuestions />} />
                      <Route path="/host/:id" element={<HostDashboard />} />
                      <Route path="/room/:id" element={<PlayerScreen />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/auction" element={<Auction />} />
                      <Route path="/boutique" element={<Boutique />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/auth/twitch/callback" element={<AuthCallback />} />
                    </Routes>
                  </main>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </AppContent>
      </DataProvider>
    </ErrorBoundary>
  );
}
