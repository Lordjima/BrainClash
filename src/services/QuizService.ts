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
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RoomState, Question, GlobalLeaderboardEntry, ShopItem, Chest } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class QuizService {
  private static ROOMS_COLLECTION = 'rooms';
  private static PROFILES_COLLECTION = 'profiles';
  private static QUESTIONS_COLLECTION = 'questions';

  /**
   * Create a new quiz room
   */
  static async createRoom(quizData: { 
    name: string, 
    description: string, 
    theme: string, 
    timeLimit: number,
    questions: Question[]
  }): Promise<string> {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const roomRef = doc(db, this.ROOMS_COLLECTION, code);

    const roomState: RoomState = {
      id: code,
      name: quizData.name,
      description: quizData.description,
      theme: quizData.theme,
      timeLimit: quizData.timeLimit,
      hostId: auth.currentUser?.uid || 'anonymous',
      status: 'lobby',
      players: {},
      questions: quizData.questions,
      currentQuestionIndex: 0,
      questionStartTime: null,
      showAnswer: false
    };

    try {
      await setDoc(roomRef, roomState);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.ROOMS_COLLECTION + '/' + code);
    }
    return code;
  }

  /**
   * Create a room with a specific code
   */
  static async createRoomWithCode(code: string, quizData: { 
    name: string, 
    description: string, 
    theme: string, 
    timeLimit: number,
    questions: Question[]
  }): Promise<void> {
    const roomRef = doc(db, this.ROOMS_COLLECTION, code);

    const roomState: RoomState = {
      id: code,
      name: quizData.name,
      description: quizData.description,
      theme: quizData.theme,
      timeLimit: quizData.timeLimit,
      hostId: auth.currentUser?.uid || 'anonymous',
      status: 'lobby',
      players: {},
      questions: quizData.questions,
      currentQuestionIndex: 0,
      questionStartTime: null,
      showAnswer: false
    };

    try {
      await setDoc(roomRef, roomState);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.ROOMS_COLLECTION + '/' + code);
    }
  }

  /**
   * Join a room
   */
  static async joinRoom(roomCode: string, username: string, avatar?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }

    if (!roomSnap?.exists()) throw new Error('Room not found');

    const playerData = {
      id: user.uid,
      username,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      score: 0,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      hasAnswered: false,
      level: 1
    };

    try {
      await updateDoc(roomRef, {
        [`players.${user.uid}`]: playerData
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
    }
  }

  /**
   * Submit an answer
   */
  static async submitAnswer(roomCode: string, answerIndex: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }
    if (!roomSnap?.exists()) return;

    const room = roomSnap.data() as RoomState;
    if (room.status !== 'active' || room.showAnswer) return;

    const currentQ = room.questions[room.currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.correctOptionIndex;
    
    let points = 0;
    if (isCorrect && room.questionStartTime) {
      const timeElapsed = Date.now() - room.questionStartTime;
      const timeLeft = Math.max(0, currentQ.timeLimit * 1000 - timeElapsed);
      const speedBonus = Math.floor((timeLeft / (currentQ.timeLimit * 1000)) * 100);
      points = 100 + speedBonus;
    }

    try {
      await updateDoc(roomRef, {
        [`players.${user.uid}.hasAnswered`]: true,
        [`players.${user.uid}.isCorrect`]: isCorrect,
        [`players.${user.uid}.score`]: increment(points)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
    }
  }

  /**
   * Reset room to lobby state (Host only)
   */
  static async resetRoom(roomCode: string): Promise<void> {
    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }
    if (!roomSnap?.exists()) return;
    const room = roomSnap.data() as RoomState;

    try {
      await updateDoc(roomRef, {
        status: 'lobby',
        currentQuestionIndex: 0,
        questionStartTime: null,
        showAnswer: false,
        ...Object.keys(room.players).reduce((acc, uid) => ({
          ...acc,
          [`players.${uid}.hasAnswered`]: false,
          [`players.${uid}.isCorrect`]: false,
          [`players.${uid}.score`]: 0
        }), {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
    }
  }

  static async closeRoom(roomCode: string): Promise<void> {
    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    try {
      await updateDoc(roomRef, { status: 'closed' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
    }
  }

  /**
   * Finish the game and update global profiles
   */
  static async finishGame(roomCode: string): Promise<void> {
    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }
    if (!roomSnap?.exists()) return;

    const room = roomSnap.data() as RoomState;
    if (room.status === 'finished') return; // Already finished

    // Update room status
    try {
      await updateDoc(roomRef, { status: 'finished' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
    }
  }

  static async updatePlayerProfile(roomCode: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      console.log('UpdateProfile: No user');
      return;
    }

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }
    if (!roomSnap?.exists()) {
      console.log('UpdateProfile: Room not found');
      return;
    }
    const room = roomSnap.data() as RoomState;
    if (room.status !== 'finished') {
      console.log('UpdateProfile: Room not finished, status:', room.status);
      return;
    }

    const player = room.players[user.uid];
    if (!player) {
      console.log('UpdateProfile: Player not in room');
      return;
    }

    console.log('UpdateProfile: Processing rewards for', player.username, 'Score:', player.score);

    // Update global profile for the player
    const profileRef = doc(db, this.PROFILES_COLLECTION, user.uid);
    let profileSnap;
    try {
      profileSnap = await getDoc(profileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.PROFILES_COLLECTION + '/' + user.uid);
    }

    if (profileSnap?.exists()) {
      const profile = profileSnap.data() as GlobalLeaderboardEntry;
      if (profile.processedGames?.includes(roomCode)) {
        console.log('UpdateProfile: Game already processed');
        return;
      }

      const coinsToAdd = Math.floor(player.score / 5); // Increased reward: 1 coin per 5 points
      const brainCoinsToAdd = Math.floor(player.score / 50); // Increased reward: 1 brainCoin per 50 points

      console.log(`UpdateProfile: Adding ${coinsToAdd} coins and ${brainCoinsToAdd} brainCoins`);

      try {
        await updateDoc(profileRef, {
          score: increment(player.score),
          games_played: increment(1),
          coins: increment(coinsToAdd),
          brainCoins: increment(brainCoinsToAdd),
          processedGames: arrayUnion(roomCode)
        });
        console.log('UpdateProfile: Profile updated successfully');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, this.PROFILES_COLLECTION + '/' + user.uid);
      }
    } else {
      // Create profile if it doesn't exist
      const coinsToAdd = Math.floor(player.score / 5);
      const brainCoinsToAdd = Math.floor(player.score / 50);
      
      console.log(`UpdateProfile: Creating profile with ${coinsToAdd} coins`);

      try {
        await setDoc(profileRef, {
          username: player.username,
          score: player.score,
          games_played: 1,
          date: Date.now(),
          coins: coinsToAdd,
          brainCoins: brainCoinsToAdd,
          is_sub: false,
          badges: [],
          inventory: [],
          level: 1,
          xp: player.score,
          processedGames: [roomCode]
        });
        console.log('UpdateProfile: Profile created successfully');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, this.PROFILES_COLLECTION + '/' + user.uid);
      }
    }
  }

  static async nextQuestion(roomCode: string): Promise<void> {
    const roomRef = doc(db, this.ROOMS_COLLECTION, roomCode);
    let roomSnap;
    try {
      roomSnap = await getDoc(roomRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.ROOMS_COLLECTION + '/' + roomCode);
    }
    if (!roomSnap?.exists()) return;

    const room = roomSnap.data() as RoomState;
    const nextIndex = room.currentQuestionIndex + 1;

    if (nextIndex < room.questions.length) {
      try {
        await updateDoc(roomRef, {
          currentQuestionIndex: nextIndex,
          questionStartTime: Date.now(),
          showAnswer: false,
          // Reset player answered status
          ...Object.keys(room.players).reduce((acc, uid) => ({
            ...acc,
            [`players.${uid}.hasAnswered`]: false,
            [`players.${uid}.isCorrect`]: false
          }), {})
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, this.ROOMS_COLLECTION + '/' + roomCode);
      }
    } else {
      await this.finishGame(roomCode);
    }
  }


  /**
   * Inventory Management
   */
  static async addToInventory(itemId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');
    if (user.isAnonymous) throw new Error('Veuillez vous connecter avec Twitch pour utiliser cette fonctionnalité');

    const profileRef = doc(db, this.PROFILES_COLLECTION, user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profile = profileSnap.data() as GlobalLeaderboardEntry;
      if ((profile.inventory || []).length >= 15) {
        throw new Error('Inventaire plein (15 emplacements max)');
      }
      await updateDoc(profileRef, {
        inventory: arrayUnion(itemId)
      });
    } else {
      // Create profile if it doesn't exist
      await setDoc(profileRef, {
        username: user.displayName || 'Anonyme',
        score: 0,
        games_played: 0,
        date: Date.now(),
        coins: 0,
        brainCoins: 0,
        is_sub: false,
        badges: [],
        inventory: [itemId],
        level: 1,
        xp: 0
      });
    }
  }

  static async removeFromInventory(itemId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const profileRef = doc(db, this.PROFILES_COLLECTION, user.uid);
    await updateDoc(profileRef, {
      inventory: arrayRemove(itemId)
    });
  }

  static async triggerEffect(roomId: string, type: string, sourceName: string, duration: number = 10000): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);
    const effect = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      sourceId: user.uid,
      sourceName,
      createdAt: Date.now(),
      duration
    };

    await updateDoc(roomRef, {
      activeEffects: arrayUnion(effect)
    });
  }

  /**
   * Buy an item from the shop
   */
  static async buyItem(itemId: string, price: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const profileRef = doc(db, this.PROFILES_COLLECTION, user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) throw new Error('Profile not found');

    const profile = profileSnap.data() as GlobalLeaderboardEntry;

    // Use brainCoins for items (Sparkles icon in UI)
    if ((profile.brainCoins || 0) < price) {
      throw new Error('Pas assez de BrainCoins');
    }

    if ((profile.inventory || []).length >= 15) {
      throw new Error('Inventaire plein (15 emplacements max)');
    }

    await updateDoc(profileRef, {
      brainCoins: increment(-price),
      inventory: arrayUnion(itemId)
    });
  }

  static async buyChest(chestId: string): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const profileRef = doc(db, this.PROFILES_COLLECTION, user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) throw new Error('Profile not found');

    const chestRef = doc(db, 'chests', chestId);
    const chestSnap = await getDoc(chestRef);
    if (!chestSnap.exists()) throw new Error('Chest not found');

    const profile = profileSnap.data() as GlobalLeaderboardEntry;
    const chest = chestSnap.data() as Chest;

    if ((profile.coins || 0) < chest.price) {
      throw new Error('Pas assez de coins');
    }

    if ((profile.inventory || []).length >= 15) {
      throw new Error('Inventaire plein (15 emplacements max)');
    }

    // Pick random item from chest
    if (!chest.possibleItems || chest.possibleItems.length === 0) {
      throw new Error('Ce coffre est vide !');
    }

    const randomIndex = Math.floor(Math.random() * chest.possibleItems.length);
    const wonItemId = chest.possibleItems[randomIndex];

    await updateDoc(profileRef, {
      coins: increment(-chest.price),
      inventory: arrayUnion(wonItemId)
    });

    return wonItemId;
  }

  /**
   * Get User Profile
   */
  static async getUserProfile(uid: string): Promise<GlobalLeaderboardEntry | null> {
    const profileRef = doc(db, this.PROFILES_COLLECTION, uid);
    const snap = await getDoc(profileRef);
    return snap.exists() ? (snap.data() as GlobalLeaderboardEntry) : null;
  }
}
