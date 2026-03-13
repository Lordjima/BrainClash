/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import HostDashboard from './components/HostDashboard';
import PlayerScreen from './components/PlayerScreen';
import Overlay from './components/Overlay';
import Profile from './components/Profile';
import CreateQuiz from './components/CreateQuiz';
import SubmitQuestion from './components/SubmitQuestion';
import ReviewQuestions from './components/ReviewQuestions';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/submit-question" element={<SubmitQuestion />} />
        <Route path="/review-questions" element={<ReviewQuestions />} />
        <Route path="/host/:id" element={<HostDashboard />} />
        <Route path="/room/:id" element={<PlayerScreen />} />
        <Route path="/overlay/:id" element={<Overlay />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
