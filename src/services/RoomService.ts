import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Room, 
  RoomParticipant, 
  RoomQuestion, 
  RoomAnswer, 
  RoomEffectDoc,
  Question
} from '../types';

export const RoomService = {
  /**
   * Create a new room
   */
  async createRoom(quizData: { 
    name: string, 
    description: string, 
    themeIds: string[], 
    timeLimit: number,
    questions: Question[]
  }): Promise<string> {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    await this.createRoomWithCode(code, quizData);
    return code;
  },

  /**
   * Create a room with a specific code
   */
  async createRoomWithCode(roomCode: string, quizData: {
    name: string,
    description: string,
    themeIds: string[],
    timeLimit: number,
    questions: Question[]
  }): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);

    const room: Omit<Room, 'players' | 'questions' | 'activeEffects'> = {
      id: roomCode,
      name: quizData.name,
      description: quizData.description,
      themeIds: quizData.themeIds,
      timeLimit: quizData.timeLimit,
      hostUid: auth.currentUser?.uid || 'anonymous',
      status: 'lobby',
      currentQuestionIndex: 0,
      questionStartTime: null,
      questionCount: quizData.questions.length,
      showAnswer: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(roomRef, room);

      // Add questions to subcollection
      const questionsRef = collection(db, `rooms/${roomCode}/questions`);
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        const roomQ: RoomQuestion = {
          ...q,
          index: i,
          order: i
        };
        await setDoc(doc(questionsRef, i.toString()), roomQ);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rooms/${roomCode}`);
      throw error;
    }
  },

  async startQuiz(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);
    const playersRef = collection(db, `rooms/${roomCode}/players`);
    
    try {
      const playersSnap = await getDocs(playersRef);
      const batch = writeBatch(db);

      // Reset players
      playersSnap.docs.forEach(pDoc => {
        batch.update(pDoc.ref, { 
          hasAnswered: false, 
          isCorrect: null, 
          lastAnswerIndex: -1,
          lastAnsweredQuestionIndex: -1 
        });
      });

      // Init room
      batch.update(roomRef, {
        status: 'active',
        currentQuestionIndex: 0,
        questionStartTime: Date.now(),
        showAnswer: false,
        updatedAt: Date.now()
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
    }
  },

  /**
   * Join a room
   */
  async joinRoom(roomCode: string, profile: { username: string, avatarUrl: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      console.error('JoinRoom failed: No authenticated user');
      throw new Error('Vous devez être connecté pour rejoindre un salon.');
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    const roomRef = doc(db, 'rooms', normalizedCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Ce salon n\'existe pas.');
      }

      const roomData = roomSnap.data() as Room;
      if (roomData.status === 'closed') {
        throw new Error('Ce salon est fermé.');
      }

      const playerRef = doc(db, `rooms/${normalizedCode}/players`, user.uid);
      
      const player: RoomParticipant = {
        id: user.uid,
        uid: user.uid,
        username: profile.username,
        avatar: profile.avatarUrl,
        avatarUrl: profile.avatarUrl,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        joinedAt: Date.now(),
        score: 0,
        streak: 0,
        hasAnswered: false,
        isCorrect: null,
        isProtected: false,
        lastAnswerIndex: -1,
        lastAnsweredQuestionIndex: -1
      };

      await setDoc(playerRef, player);
      console.log(`User ${user.uid} joined room ${normalizedCode}`);
    } catch (error: any) {
      console.error('Error in joinRoom:', error);
      if (error.code === 'permission-denied') {
        throw new Error('Erreur de permissions Firestore. Vérifiez les règles de sécurité.');
      }
      throw error;
    }
  },

  /**
   * Submit an answer
   */
  async submitAnswer(roomCode: string, questionIndex: number, answerIndex: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as Room;
    
    // Check if player already answered
    const playerRef = doc(db, `rooms/${roomCode}/players`, user.uid);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) return;
    const player = playerSnap.data() as RoomParticipant;
    if (player.hasAnswered && player.lastAnsweredQuestionIndex === questionIndex) return;

    const questionRef = doc(db, `rooms/${roomCode}/questions`, questionIndex.toString());
    const questionSnap = await getDoc(questionRef);
    if (!questionSnap.exists()) return;
    const question = questionSnap.data() as RoomQuestion;

    const isCorrect = answerIndex === question.correctOptionIndex;
    
    let points = 0;
    let responseTimeMs = 0;
    if (isCorrect && room.questionStartTime) {
      responseTimeMs = Date.now() - room.questionStartTime;
      const timeLeft = Math.max(0, question.timeLimit * 1000 - responseTimeMs);
      const speedBonus = Math.floor((timeLeft / (question.timeLimit * 1000)) * 100);
      points = 100 + speedBonus;
    }

    try {
      // 1. Update player
      await updateDoc(playerRef, {
        hasAnswered: true,
        isCorrect: isCorrect,
        score: increment(points),
        streak: isCorrect ? increment(1) : 0,
        answerTime: Date.now(),
        lastAnswerIndex: answerIndex,
        lastAnsweredQuestionIndex: questionIndex
      });

      // 2. Record answer
      const answer: RoomAnswer = {
        uid: user.uid,
        questionIndex,
        answerIndex,
        isCorrect,
        responseTimeMs,
        pointsEarned: points,
        answeredAt: Date.now()
      };
      await setDoc(doc(db, `rooms/${roomCode}/answers`, `${user.uid}_${questionIndex}`), answer);

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}/participants/${user.uid}`);
    }
  },

  /**
   * Move to the next question
   */
  async nextQuestion(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as Room;

    const nextIndex = room.currentQuestionIndex + 1;
    
    if (nextIndex >= room.questionCount) {
      await updateDoc(roomRef, { status: 'finished', updatedAt: Date.now() });
      return;
    }

    // Reset players for next question
    const playersRef = collection(db, `rooms/${roomCode}/players`);
    const playersSnap = await getDocs(playersRef);
    const batch = writeBatch(db);
    
    playersSnap.docs.forEach(d => {
      batch.update(d.ref, { 
        hasAnswered: false, 
        isCorrect: null, 
        lastAnswerIndex: -1, 
        lastAnsweredQuestionIndex: -1 
      });
    });

    batch.update(roomRef, {
      currentQuestionIndex: nextIndex,
      questionStartTime: Date.now(),
      showAnswer: false,
      updatedAt: Date.now()
    });

    await batch.commit();
  },

  /**
   * Reset a room
   */
  async resetRoom(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);
    await updateDoc(roomRef, {
      status: 'lobby',
      currentQuestionIndex: 0,
      questionStartTime: null,
      showAnswer: false,
      updatedAt: Date.now()
    });
  },

  /**
   * Close a room
   */
  async closeRoom(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);
    await updateDoc(roomRef, { status: 'closed', updatedAt: Date.now() });
  },

  /**
   * Trigger an effect
   */
  async triggerEffect(roomCode: string, type: string, sourceName: string, duration: number = 10000): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const effectsRef = collection(db, `rooms/${roomCode}/effects`);
    const effect: Omit<RoomEffectDoc, 'id'> = {
      type,
      sourceId: user.uid,
      sourceName,
      targetId: null,
      createdAt: Date.now(),
      duration: duration
    };

    try {
      await addDoc(effectsRef, effect);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${roomCode}/effects`);
    }
  }
};
