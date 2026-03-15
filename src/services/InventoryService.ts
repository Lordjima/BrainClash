import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryEntry, CatalogItem } from '../types';

export const InventoryService = {
  /**
   * Get user inventory
   */
  async getInventory(uid: string): Promise<InventoryEntry[]> {
    try {
      const inventoryRef = collection(db, `users/${uid}/inventory`);
      const snap = await getDocs(inventoryRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryEntry));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${uid}/inventory`);
      return [];
    }
  },

  /**
   * Add item to inventory
   */
  async addItem(
    uid: string, 
    itemId: string, 
    sourceType: InventoryEntry['sourceType'] = 'shop', 
    sourceId: string | null = null
  ): Promise<void> {
    const inventoryRef = collection(db, `users/${uid}/inventory`);
    
    try {
      const entry: Omit<InventoryEntry, 'id'> = {
        itemId,
        status: 'available',
        sourceType,
        sourceId,
        acquiredAt: Date.now(),
        usedAt: null
      };
      await addDoc(inventoryRef, entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/inventory`);
    }
  },

  /**
   * Remove item from inventory
   */
  async removeItem(uid: string, entryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, `users/${uid}/inventory`, entryId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/inventory/${entryId}`);
    }
  }
};
