import { doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export const UserService = {
  async isAdmin(twitchId: string): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    const path = `profiles/${uid || twitchId}`;
    try {
      let userDoc = await getDoc(doc(db, 'profiles', uid || ''));
      
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, 'profiles', twitchId));
      }

      if (userDoc.exists()) {
        return userDoc.data().role === 'admin';
      }
      return false;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return false;
    }
  }
};
