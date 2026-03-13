import React, { useEffect, useState, useRef } from 'react';
import { useQuizState, defaultQuestions, type Player } from '../lib/store';
import { TwitchChat } from '../lib/twitch';
import { Play, Square, FastForward, CheckCircle, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { state, updateState } = useQuizState();
  const [channelInput, setChannelInput] = useState(state.channel);
  const [isConnected, setIsConnected] = useState(false);
  const chatRef = useRef<TwitchChat | null>(null);

  // Reconnect if channel changes and status is not setup
  useEffect(() => {
    if (state.status !== 'setup' && state.channel && !isConnected) {
      connectTwitch(state.channel);
    }
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, [state.channel, state.status]);

  const connectTwitch = (channel: string) => {
    if (chatRef.current) {
      chatRef.current.disconnect();
    }
    
    chatRef.current = new TwitchChat(
      channel,
      (msg) => handleChatMessage(msg),
      () => setIsConnected(true),
      () => setIsConnected(false)
    );
    chatRef.current.connect();
  };

  const handleChatMessage = (msg: { username: string; color: string; text: string }) => {
    // Only process answers if a question is active and answer not shown
    if (state.status !== 'active' || state.showAnswer) return;

    const currentQ = state.questions[state.currentQuestionIndex];
    if (!currentQ) return;

    // Check if user already answered
    if (state.answeredUsers[msg.username]) return;

    // Parse answer (1, 2, 3, 4 or A, B, C, D)
    const text = msg.text.trim().toUpperCase();
    let answerIndex = -1;

    if (['1', 'A'].includes(text)) answerIndex = 0;
    else if (['2', 'B'].includes(text)) answerIndex = 1;
    else if (['3', 'C'].includes(text)) answerIndex = 2;
    else if (['4', 'D'].includes(text)) answerIndex = 3;

    if (answerIndex !== -1) {
      // Record that user answered
      updateState((prev) => ({
        answeredUsers: { ...prev.answeredUsers, [msg.username]: true }
      }));

      // Check if correct
      if (answerIndex === currentQ.correctOptionIndex) {
        // Calculate points based on speed
        const timeElapsed = Date.now() - (state.questionStartTime || Date.now());
        const timeLeft = Math.max(0, currentQ.timeLimit * 1000 - timeElapsed);
        const speedBonus = Math.floor((timeLeft / (currentQ.timeLimit * 1000)) * 100);
        const points = 100 + speedBonus;

        updateState((prev) => {
          const currentScore = prev.leaderboard[msg.username]?.score || 0;
          return {
            leaderboard: {
              ...prev.leaderboard,
              [msg.username]: {
                username: msg.username,
                color: msg.color,
                score: currentScore + points,
              }
            }
          };
        });
      }
    }
  };

  const handleStartQuiz = () => {
    updateState({
      channel: channelInput,
      status: 'idle',
      currentQuestionIndex: 0,
      leaderboard: {},
      answeredUsers: {},
      showAnswer: false,
    });
    connectTwitch(channelInput);
  };

  const handleNextQuestion = () => {
    updateState((prev) => ({
      status: 'active',
      questionStartTime: Date.now(),
      answeredUsers: {},
      showAnswer: false,
    }));
  };

  const handleRevealAnswer = () => {
    updateState({ showAnswer: true });
  };

  const handleGoToNext = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      updateState((prev) => ({
        status: 'idle',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showAnswer: false,
        answeredUsers: {},
      }));
    } else {
      updateState({ status: 'finished' });
    }
  };

  const handleReset = () => {
    if (chatRef.current) chatRef.current.disconnect();
    updateState({
      status: 'setup',
      currentQuestionIndex: 0,
      leaderboard: {},
      answeredUsers: {},
      showAnswer: false,
    });
  };

  if (state.status === 'setup') {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Twitch Live Quiz</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">
            Engagez votre chat avec des quiz interactifs en temps réel.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Chaîne Twitch
              </label>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="ex: zerator"
                className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <button
              onClick={handleStartQuiz}
              disabled={!channelInput}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Lancer le Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = state.questions[state.currentQuestionIndex];
  const sortedLeaderboard = (Object.values(state.leaderboard) as Player[]).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                Connecté à #{state.channel}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {Object.keys(state.answeredUsers).length} réponses reçues pour cette question
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/overlay"
                target="_blank"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
              >
                Ouvrir l'Overlay
              </Link>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 min-h-[400px] flex flex-col">
            {state.status === 'finished' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-purple-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Quiz Terminé !</h2>
                <p className="text-zinc-400">Le gagnant est {sortedLeaderboard[0]?.username || 'personne'} !</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
                    Question {state.currentQuestionIndex + 1} / {state.questions.length}
                  </span>
                  <span className="text-sm text-zinc-400">
                    Temps: {currentQ.timeLimit}s
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-8">{currentQ.text}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {currentQ.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${
                        state.showAnswer && i === currentQ.correctOptionIndex
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : state.showAnswer
                          ? 'bg-transparent border-zinc-800 text-zinc-600'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      <span className="font-mono text-zinc-500 mr-3">{i + 1}.</span>
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-4">
                  {state.status === 'idle' && (
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-5 h-5" /> Lancer la question
                    </button>
                  )}
                  
                  {state.status === 'active' && !state.showAnswer && (
                    <button
                      onClick={handleRevealAnswer}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" /> Révéler la réponse
                    </button>
                  )}

                  {state.status === 'active' && state.showAnswer && (
                    <button
                      onClick={handleGoToNext}
                      className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <FastForward className="w-5 h-5" /> Question suivante
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col h-[calc(100vh-3rem)]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Classement en direct
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {sortedLeaderboard.length === 0 ? (
              <p className="text-zinc-500 text-center mt-10 text-sm">Aucun score pour le moment.</p>
            ) : (
              sortedLeaderboard.map((player, index) => (
                <div key={player.username} className="flex items-center justify-between bg-transparent p-3 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-sm w-4">{index + 1}.</span>
                    <span className="font-medium" style={{ color: player.color }}>
                      {player.username}
                    </span>
                  </div>
                  <span className="font-mono text-purple-400 font-bold">
                    {player.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
