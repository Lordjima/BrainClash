import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const UserService = {
  async isAdmin(twitchId: string): Promise<boolean> {
    try {
      const uid = auth.currentUser?.uid;
      let userDoc = await getDoc(doc(db, 'profiles', uid || ''));
      
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, 'profiles', twitchId));
      }

      if (userDoc.exists()) {
        return userDoc.data().role === 'admin';
      }
      return false;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  }
};
