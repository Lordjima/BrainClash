import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserAccount, PublicProfile, UserStats, UserWallet, TwitchConnection } from '../types';

export const UserService = {
  /**
   * Check if a user is an admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    try {
      console.log('Checking admin status for:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('User doc exists:', userDoc.exists());
      if (userDoc.exists()) {
        return (userDoc.data() as UserAccount).role === 'admin';
      }
      return false;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      return false;
    }
  },

  /**
   * Initialize or update a user account and its sub-components
   */
  async syncUser(twitchUser: any): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const now = Date.now();

    const isAdminTwitchUser =
      twitchUser?.login?.toLowerCase() === 'jimag4ming' ||
      twitchUser?.display_name?.toLowerCase() === 'jimag4ming';

    try {
      // 1. User Account
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newUser: UserAccount = {
          uid,
          role: isAdminTwitchUser ? 'admin' : 'user',
          status: 'active',
          createdAt: now,
          updatedAt: now
        };
        await setDoc(userRef, newUser);
      } else {
        await updateDoc(userRef, {
          updatedAt: now,
          role: isAdminTwitchUser ? 'admin' : userSnap.data().role
        });
      }

      // 2. Twitch Connection
      const twitchRef = doc(db, `users/${uid}/connections`, 'twitch');
      const twitchData: TwitchConnection = {
        provider: 'twitch',
        twitchUserId: twitchUser.id,
        login: twitchUser.login,
        displayName: twitchUser.display_name,
        avatarUrl: twitchUser.profile_image_url,
        connectedAt: now,
        updatedAt: now
      };
      await setDoc(twitchRef, twitchData);

      // 3. Public Profile
      const profileRef = doc(db, `users/${uid}/public`, 'profile');
      const profileData: PublicProfile = {
        username: twitchUser.display_name,
        avatarUrl: twitchUser.profile_image_url,
        level: 1,
        updatedAt: now
      };
      await setDoc(profileRef, profileData, { merge: true });

      // 4. Stats (Initialize if missing)
      const statsRef = doc(db, `users/${uid}/stats`, 'global');
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        const newStats: UserStats = {
          scoreTotal: 0,
          gamesPlayed: 0,
          wins: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          xp: 0,
          level: 1,
          updatedAt: now
        };
        await setDoc(statsRef, newStats);
      }

      // 5. Wallet (Initialize if missing)
      const walletRef = doc(db, `users/${uid}/wallet`, 'main');
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        const walletData: UserWallet = {
          coins: 500,
          brainCoins: 10,
          updatedAt: now
        };
        await setDoc(walletRef, walletData);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  },

  /**
   * Get full user data (for context)
   */
  async getFullUser(uid: string) {
    try {
      const [account, profile, stats, wallet] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, `users/${uid}/public`, 'profile')),
        getDoc(doc(db, `users/${uid}/stats`, 'global')),
        getDoc(doc(db, `users/${uid}/wallet`, 'main'))
      ]);

      return {
        account: account.data() as UserAccount,
        profile: profile.data() as PublicProfile,
        stats: stats.data() as UserStats,
        wallet: wallet.data() as UserWallet
      };
    } catch (err) {
      console.error('Error fetching full user data:', err);
      return null;
    }
  }
};
