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
import Leaderboard from './pages/Leaderboard';
import CreateQuiz from './pages/CreateQuiz';
import SubmitQuestion from './pages/SubmitQuestion';
import ReviewQuestions from './pages/ReviewQuestions';
import Auction from './pages/Auction';
import Boutique from './pages/Boutique';
import AdminDashboard from './pages/AdminDashboard';
import Rules from './pages/Rules';
import AuthCallback from './pages/AuthCallback';
import Navbar from './components/ui/Navbar';
import { BottomBar } from './components/ui/BottomBar';
import SpaceBackground from './components/SpaceBackground';
import { RoomWrapper } from './components/RoomWrapper';

import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider, useUser } from './context/UserContext';
import { CatalogProvider, useCatalog } from './context/CatalogContext';
import { Button } from './components/ui/Button';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isAuthReady } = useAuth();
  const { isLoading: isUserLoading } = useUser();
  const { isLoaded: isCatalogLoaded } = useCatalog();

  if (!isAuthReady || isUserLoading || !isCatalogLoaded) {
    return (
      <div 
        className="fixed inset-0 bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 z-[9999]"
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
      <AuthProvider>
        <UserProvider>
          <CatalogProvider>
            <AppContent>
              <SpaceBackground />
              <BrowserRouter>
                <Routes>
                  <Route path="/overlay/:id" element={<RoomWrapper><Overlay /></RoomWrapper>} />
                  <Route path="/auth/twitch/callback" element={<AuthCallback />} />
                  
                  {/* All other routes */}
                  <Route path="*" element={
                    <div className="h-screen flex flex-col overflow-hidden">
                      <Navbar />
                      <main className="flex-1 overflow-hidden flex flex-col relative">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/create" element={<CreateQuiz />} />
                          <Route path="/submit-question" element={<SubmitQuestion />} />
                          <Route path="/review-questions" element={<ReviewQuestions />} />
                          <Route path="/host/:id" element={<RoomWrapper><HostDashboard /></RoomWrapper>} />
                          <Route path="/room/:id" element={<RoomWrapper><PlayerScreen /></RoomWrapper>} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/leaderboard" element={<Leaderboard />} />
                          <Route path="/auction" element={<Auction />} />
                          <Route path="/boutique" element={<Boutique />} />
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/rules" element={<Rules />} />
                        </Routes>
                      </main>
                      <BottomBar />
                    </div>
                  } />
                </Routes>
              </BrowserRouter>
            </AppContent>
          </CatalogProvider>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
