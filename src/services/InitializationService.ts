import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { INITIAL_SHOP_ITEMS, INITIAL_BADGES, INITIAL_CHESTS } from '../data/initialData';

export class InitializationService {
  static async initializeDatabase() {
    try {
      console.log('Updating catalog items...');
      for (const item of INITIAL_SHOP_ITEMS) {
        try {
          await setDoc(doc(db, 'catalogItems', String(item.id)), {
            ...item,
            active: item.active ?? true,
            createdAt: item.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `catalogItems/${item.id}`);
        }
      }

      const badgesSnap = await getDocs(collection(db, 'catalogBadges'));
      if (badgesSnap.empty) {
        console.log('Initializing catalog badges...');
        for (const badge of INITIAL_BADGES) {
          try {
            await setDoc(doc(db, 'catalogBadges', String(badge.id)), badge);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `catalogBadges/${badge.id}`);
          }
        }
      }

      console.log('Updating catalog chests...');
      for (const chest of INITIAL_CHESTS) {
        try {
          await setDoc(doc(db, 'catalogChests', String(chest.id)), {
            ...chest,
            active: chest.active ?? true,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `catalogChests/${chest.id}`);
        }
      }

      console.log('Database initialization complete.');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}
