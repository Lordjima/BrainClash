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
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Room, RoomParticipant, RoomQuestion, Question, PublicProfile, UserStats, UserWallet } from '../types';
import { RoomService } from './RoomService';
import { WalletService } from './WalletService';
import { InventoryService } from './InventoryService';
import { UserService } from './UserService';

export class QuizService {
  /**
   * Create a new quiz room
   */
  static async createRoom(quizData: { 
    name: string, 
    description: string, 
    themeIds: string[], 
    timeLimit: number,
    questions: Question[]
  }): Promise<string> {
    return RoomService.createRoom(quizData);
  }

  /**
   * Join a room
   */
  static async joinRoom(roomCode: string, username: string, avatarUrl?: string): Promise<void> {
    const profile = {
      username,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };
    return RoomService.joinRoom(roomCode, profile);
  }

  /**
   * Submit an answer
   */
  static async submitAnswer(roomCode: string, questionIndex: number, answerIndex: number): Promise<void> {
    return RoomService.submitAnswer(roomCode, questionIndex, answerIndex);
  }

  /**
   * Finish the game and update player stats/wallet
   */
  static async finishGame(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomCode);
    try {
      await updateDoc(roomRef, { status: 'finished', updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
    }
  }

  /**
   * Remove an item from user inventory
   */
  static async removeFromInventory(itemId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    return InventoryService.removeItem(user.uid, itemId);
  }

  /**
   * Trigger an effect in a room
   */
  static async triggerEffect(roomCode: string, type: string, sourceName: string, duration?: number): Promise<void> {
    return RoomService.triggerEffect(roomCode, type, sourceName, duration);
  }

  /**
   * Process rewards for a player after a game
   */
  static async processRewards(roomCode: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const playerRef = doc(db, `rooms/${roomCode}/players`, user.uid);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) return;
    const player = playerSnap.data() as RoomParticipant;

    // 1. Update Stats
    const statsRef = doc(db, `users/${user.uid}/stats`, 'global');
    await updateDoc(statsRef, {
      scoreTotal: increment(player.score),
      gamesPlayed: increment(1),
      xp: increment(player.score),
      updatedAt: Date.now()
    });

    // 2. Update Wallet
    const coinsToAdd = player.score;
    const brainCoinsToAdd = Math.floor(player.score / 10);
    
    if (coinsToAdd > 0) {
      await WalletService.updateBalance(
        user.uid, 
        coinsToAdd, 
        'coins', 
        'game_reward', 
        `Récompense pour la partie ${roomCode}`
      );
    }
    
    if (brainCoinsToAdd > 0) {
      await WalletService.updateBalance(
        user.uid, 
        brainCoinsToAdd, 
        'brainCoins', 
        'game_reward', 
        `Bonus BrainCoins pour la partie ${roomCode}`
      );
    }

    // 3. Record Game Result
    const gameResultRef = doc(db, `users/${user.uid}/gameResults`, roomCode);
    await setDoc(gameResultRef, {
      roomId: roomCode,
      score: player.score,
      timestamp: Date.now()
    });

    // 4. Update Leaderboard
    const [profileSnap, statsSnap, walletSnap] = await Promise.all([
      getDoc(doc(db, `users/${user.uid}/public`, 'profile')),
      getDoc(doc(db, `users/${user.uid}/stats`, 'global')),
      getDoc(doc(db, `users/${user.uid}/wallet`, 'main'))
    ]);

    if (profileSnap.exists() && statsSnap.exists() && walletSnap.exists()) {
      const profile = profileSnap.data() as PublicProfile;
      const stats = statsSnap.data() as UserStats;
      const wallet = walletSnap.data() as UserWallet;

      await setDoc(doc(db, 'leaderboard', user.uid), {
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        level: stats.level,
        score: stats.scoreTotal,
        coins: wallet.coins,
        brainCoins: wallet.brainCoins,
        updatedAt: Date.now()
      }, { merge: true });
    }
  }

  /**
   * Create a room with a specific code
   */
  static async createRoomWithCode(roomCode: string, quizData: {
    name: string,
    description: string,
    themeIds: string[],
    timeLimit: number,
    questions: Question[]
  }): Promise<void> {
    return RoomService.createRoomWithCode(roomCode, quizData);
  }

  /**
   * Move to the next question
   */
  static async nextQuestion(roomCode: string): Promise<void> {
    return RoomService.nextQuestion(roomCode);
  }

  /**
   * Reset a room
   */
  static async resetRoom(roomCode: string): Promise<void> {
    return RoomService.resetRoom(roomCode);
  }

  /**
   * Close a room
   */
  static async closeRoom(roomCode: string): Promise<void> {
    return RoomService.closeRoom(roomCode);
  }

  /**
   * Buy a chest
   */
  static async buyChest(chestId: string): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // This logic should ideally be in a dedicated service, but for now:
    const chestSnap = await getDoc(doc(db, 'catalogChests', chestId));
    if (!chestSnap.exists()) throw new Error('Chest not found');
    const chest = chestSnap.data();
    
    await WalletService.updateBalance(
      user.uid,
      -chest.price,
      chest.currency,
      'shop_purchase',
      `Achat de coffre: ${chest.name}`
    );
    
    let wonItem = null;
    // Add items from chest to inventory (simplified logic)
    if (chest.possibleItems && chest.possibleItems.length > 0) {
      wonItem = chest.possibleItems[Math.floor(Math.random() * chest.possibleItems.length)];
      await InventoryService.addItem(user.uid, wonItem, 'chest', chestId);
    }

    // Update Leaderboard
    const walletSnap = await getDoc(doc(db, `users/${user.uid}/wallet`, 'main'));
    if (walletSnap.exists()) {
      const wallet = walletSnap.data() as UserWallet;
      await updateDoc(doc(db, 'leaderboard', user.uid), {
        coins: wallet.coins,
        brainCoins: wallet.brainCoins,
        updatedAt: Date.now()
      });
    }

    return wonItem;
  }

  /**
   * Buy an item
   */
  static async buyItem(itemId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const itemSnap = await getDoc(doc(db, 'catalogItems', itemId));
    if (!itemSnap.exists()) throw new Error('Item not found');
    const item = itemSnap.data();
    
    await WalletService.updateBalance(
      user.uid,
      -item.price,
      item.currency,
      'shop_purchase',
      `Achat d'objet: ${item.name}`
    );
    
    await InventoryService.addItem(user.uid, itemId, 'shop', itemId);

    // Update Leaderboard
    const walletSnap = await getDoc(doc(db, `users/${user.uid}/wallet`, 'main'));
    if (walletSnap.exists()) {
      const wallet = walletSnap.data() as UserWallet;
      await updateDoc(doc(db, 'leaderboard', user.uid), {
        coins: wallet.coins,
        brainCoins: wallet.brainCoins,
        updatedAt: Date.now()
      });
    }
  }
}
