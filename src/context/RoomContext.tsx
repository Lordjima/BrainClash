import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Room, RoomParticipant, RoomQuestion, RoomEffectDoc } from '../types';

const RoomContext = createContext<{ room: Room | null; loading: boolean } | null>(null);

export const RoomProvider = ({ roomId, children }: { roomId: string; children: React.ReactNode }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const participantsRef = collection(db, `rooms/${roomId}/participants`);
    const questionsRef = collection(db, `rooms/${roomId}/questions`);
    const effectsRef = collection(db, `rooms/${roomId}/effects`);

    const unsubRoom = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoom(prev => ({ ...prev, ...doc.data() } as Room));
      }
    });

    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      const players: Record<string, RoomParticipant> = {};
      snapshot.docs.forEach(doc => {
        players[doc.id] = doc.data() as RoomParticipant;
      });
      setRoom(prev => prev ? ({ ...prev, players } as Room) : null);
    });

    const unsubQuestions = onSnapshot(questionsRef, (snapshot) => {
      const questions: RoomQuestion[] = [];
      snapshot.docs.forEach(doc => {
        questions.push(doc.data() as RoomQuestion);
      });
      questions.sort((a, b) => a.index - b.index);
      setRoom(prev => prev ? ({ ...prev, questions } as Room) : null);
    });

    const unsubEffects = onSnapshot(effectsRef, (snapshot) => {
      const activeEffects: RoomEffectDoc[] = [];
      snapshot.docs.forEach(doc => {
        activeEffects.push({ id: doc.id, ...doc.data() } as RoomEffectDoc);
      });
      setRoom(prev => prev ? ({ ...prev, activeEffects } as Room) : null);
    });

    setLoading(false);

    return () => {
      unsubRoom();
      unsubParticipants();
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
