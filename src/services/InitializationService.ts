import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { INITIAL_SHOP_ITEMS, INITIAL_BADGES, INITIAL_CHESTS } from '../data/initialData';

export class InitializationService {
  static async initializeDatabase() {
    try {
      // Initialize Shop Items
      const shopSnap = await getDocs(collection(db, 'shopItems'));
      if (shopSnap.empty) {
        console.log('Initializing shop items...');
        for (const item of INITIAL_SHOP_ITEMS) {
          await setDoc(doc(db, 'shopItems', item.id.toString()), item);
        }
      }

      // Initialize Badges
      const badgesSnap = await getDocs(collection(db, 'badges'));
      if (badgesSnap.empty) {
        console.log('Initializing badges...');
        for (const badge of INITIAL_BADGES) {
          await setDoc(doc(db, 'badges', badge.id.toString()), badge);
        }
      }

      // Initialize Chests
      const chestsSnap = await getDocs(collection(db, 'chests'));
      if (chestsSnap.empty) {
        console.log('Initializing chests...');
        for (const chest of INITIAL_CHESTS) {
          await setDoc(doc(db, 'chests', chest.id.toString()), chest);
        }
      }
      
      console.log('Database initialization complete.');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}
