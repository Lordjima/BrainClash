/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HostDashboard from './pages/HostDashboard';
import PlayerScreen from './pages/PlayerScreen';
import Overlay from './pages/Overlay';
import Profile from './pages/Profile';
import CreateQuiz from './pages/CreateQuiz';
import SubmitQuestion from './pages/SubmitQuestion';
import ReviewQuestions from './pages/ReviewQuestions';
import AuctionHouse from './pages/AuctionHouse';
import Navbar from './components/Navbar';
import SpaceBackground from './components/SpaceBackground';

import { DataProvider } from './DataContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <SpaceBackground />
        <BrowserRouter>
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
                  <Route path="/auction-house" element={<AuctionHouse />} />
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </DataProvider>
    </ErrorBoundary>
  );
}
