import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Room, RoomParticipant, RoomQuestion, RoomEffectDoc } from '../types';

const RoomContext = createContext<{ room: Room | null; loading: boolean } | null>(null);

export const RoomProvider = ({ roomId, children }: { roomId: string; children: React.ReactNode }) => {
  const [roomDoc, setRoomDoc] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Record<string, RoomParticipant>>({});
  const [questions, setQuestions] = useState<RoomQuestion[]>([]);
  const [activeEffects, setActiveEffects] = useState<RoomEffectDoc[]>([]);
  const [loaded, setLoaded] = useState({ room: false, players: false, questions: false, effects: false });
  const loading = !loaded.room || !loaded.players || !loaded.questions || !loaded.effects;

  const room = React.useMemo(() => {
    if (!roomDoc) return null;
    return {
      ...roomDoc,
      players,
      questions,
      activeEffects
    };
  }, [roomDoc, players, questions, activeEffects]);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const playersRef = collection(db, `rooms/${roomId}/players`);
    const questionsRef = collection(db, `rooms/${roomId}/questions`);
    const effectsRef = collection(db, `rooms/${roomId}/effects`);

    const unsubRoom = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomDoc(doc.data() as Room);
      }
      setLoaded(prev => ({ ...prev, room: true }));
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const players: Record<string, RoomParticipant> = {};
      snapshot.docs.forEach(doc => {
        players[doc.id] = doc.data() as RoomParticipant;
      });
      setPlayers(players);
      setLoaded(prev => ({ ...prev, players: true }));
    });

    const unsubQuestions = onSnapshot(questionsRef, (snapshot) => {
      const questions: RoomQuestion[] = [];
      snapshot.docs.forEach(doc => {
        questions.push(doc.data() as RoomQuestion);
      });
      questions.sort((a, b) => a.index - b.index);
      setQuestions(questions);
      setLoaded(prev => ({ ...prev, questions: true }));
    });

    const unsubEffects = onSnapshot(effectsRef, (snapshot) => {
      const activeEffects: RoomEffectDoc[] = [];
      snapshot.docs.forEach(doc => {
        activeEffects.push({ id: doc.id, ...doc.data() } as RoomEffectDoc);
      });
      setActiveEffects(activeEffects);
      setLoaded(prev => ({ ...prev, effects: true }));
    });

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubQuestions();
      unsubEffects();
    };
  }, [roomId]);

  return <RoomContext.Provider value={{ room, loading }}>{children}</RoomContext.Provider>;
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within a RoomProvider');
  return context;
};
