import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserWallet, WalletTransaction } from '../types';

export const WalletService = {
  /**
   * Get user wallet balance
   */
  async getBalance(uid: string): Promise<UserWallet | null> {
    try {
      const walletRef = doc(db, `users/${uid}/wallet`, 'main');
      const snap = await getDoc(walletRef);
      return snap.exists() ? (snap.data() as UserWallet) : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}/wallet/main`);
      return null;
    }
  },

  /**
   * Add or subtract currency
   */
  async updateBalance(
    uid: string, 
    amount: number, 
    currency: 'coins' | 'brainCoins', 
    type: WalletTransaction['type'],
    description: string,
    metadata?: any
  ): Promise<void> {
    const walletRef = doc(db, `users/${uid}/wallet`, 'main');
    const transactionsRef = collection(db, `users/${uid}/walletTransactions`);

    try {
      // 1. Update balance
      await updateDoc(walletRef, {
        [currency]: increment(amount),
        updatedAt: Date.now()
      });

      // 2. Record transaction
      const transaction: WalletTransaction = {
        type,
        currency,
        amount,
        description,
        timestamp: Date.now(),
        metadata: metadata ?? null
      };
      await addDoc(transactionsRef, transaction);

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/wallet/main`);
    }
  }
};
