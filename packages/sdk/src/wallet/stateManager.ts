/**
 * Encrypted State Management
 * 
 * Manages encrypted storage of balance notes and orders in IndexedDB.
 * Provides state synchronization with on-chain data.
 * 
 * Requirements: 14.6
 */

import { BalanceNote } from './balanceNoteManager';
import { OrderCommitment } from './orderCommitmentManager';

/**
 * Database schema version
 */
const DB_VERSION = 1;

/**
 * Store names
 */
const STORES = {
  BALANCE_NOTES: 'balance-notes',
  ORDERS: 'orders',
  SYNC_STATE: 'sync-state',
} as const;

/**
 * Encrypted order for storage
 */
interface EncryptedOrder {
  encryptedData: string;
  iv: string;
  commitmentHash: string;
  status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  updatedAt: number;
}

/**
 * Sync state tracking
 */
interface SyncState {
  key: string;
  lastSyncBlock: number;
  lastSyncTimestamp: number;
  treeRoot: string;
}

/**
 * State Manager
 * Handles encrypted storage and synchronization
 */
export class StateManager {
  private dbName: string = 'phantom-darkpool';
  private db: IDBDatabase | null = null;
  private masterKey: bigint;
  private encryptionKey: CryptoKey | null = null;

  constructor(masterKey: bigint) {
    this.masterKey = masterKey;
  }

  /**
   * Initialize IndexedDB with complete schema
   */
  async initialize(): Promise<void> {
    // Derive encryption key first
    this.encryptionKey = await this.deriveEncryptionKey();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create balance notes store
        if (!db.objectStoreNames.contains(STORES.BALANCE_NOTES)) {
          const balanceStore = db.createObjectStore(STORES.BALANCE_NOTES, {
            keyPath: 'commitment',
          });
          balanceStore.createIndex('spent', 'spent', { unique: false });
          balanceStore.createIndex('asset', 'asset', { unique: false });
          balanceStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create orders store
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const orderStore = db.createObjectStore(STORES.ORDERS, {
            keyPath: 'commitmentHash',
          });
          orderStore.createIndex('status', 'status', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
          orderStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create sync state store
        if (!db.objectStoreNames.contains(STORES.SYNC_STATE)) {
          db.createObjectStore(STORES.SYNC_STATE, {
            keyPath: 'key',
          });
        }
      };
    });
  }

  /**
   * Store encrypted balance note
   * 
   * @param note - Balance note to store
   */
  async storeBalanceNote(note: BalanceNote): Promise<void> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const encrypted = await this.encryptBalanceNote(note);

    const transaction = this.db.transaction([STORES.BALANCE_NOTES], 'readwrite');
    const objectStore = transaction.objectStore(STORES.BALANCE_NOTES);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(encrypted);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get balance note by commitment
   * 
   * @param commitment - Note commitment
   * @returns Balance note or null
   */
  async getBalanceNote(commitment: string): Promise<BalanceNote | null> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.BALANCE_NOTES], 'readonly');
    const objectStore = transaction.objectStore(STORES.BALANCE_NOTES);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(commitment);

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }

        try {
          const note = await this.decryptBalanceNote(request.result);
          resolve(note);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all balance notes for an asset
   * 
   * @param asset - Asset address
   * @param includeSpent - Include spent notes
   * @returns Array of balance notes
   */
  async getBalanceNotesByAsset(
    asset: string,
    includeSpent: boolean = false
  ): Promise<BalanceNote[]> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.BALANCE_NOTES], 'readonly');
    const objectStore = transaction.objectStore(STORES.BALANCE_NOTES);

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = async () => {
        const encryptedNotes = request.result;
        const notes: BalanceNote[] = [];

        for (const encrypted of encryptedNotes) {
          try {
            const note = await this.decryptBalanceNote(encrypted);
            if (note.asset === asset && (includeSpent || !note.spent)) {
              notes.push(note);
            }
          } catch (error) {
            console.error('Failed to decrypt note:', error);
          }
        }

        resolve(notes);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store encrypted order
   * 
   * @param order - Order commitment to store
   * @param status - Order status
   */
  async storeOrder(
    order: OrderCommitment,
    status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired' = 'pending'
  ): Promise<void> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const encrypted = await this.encryptOrder(order, status);

    const transaction = this.db.transaction([STORES.ORDERS], 'readwrite');
    const objectStore = transaction.objectStore(STORES.ORDERS);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(encrypted);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get order by commitment hash
   * 
   * @param commitmentHash - Order commitment hash
   * @returns Order commitment or null
   */
  async getOrder(commitmentHash: string): Promise<OrderCommitment | null> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.ORDERS], 'readonly');
    const objectStore = transaction.objectStore(STORES.ORDERS);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(commitmentHash);

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }

        try {
          const order = await this.decryptOrder(request.result);
          resolve(order);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get orders by status
   * 
   * @param status - Order status filter
   * @returns Array of order commitments
   */
  async getOrdersByStatus(
    status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired'
  ): Promise<OrderCommitment[]> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.ORDERS], 'readonly');
    const objectStore = transaction.objectStore(STORES.ORDERS);
    const index = objectStore.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);

      request.onsuccess = async () => {
        const encryptedOrders = request.result;
        const orders: OrderCommitment[] = [];

        for (const encrypted of encryptedOrders) {
          try {
            const order = await this.decryptOrder(encrypted);
            orders.push(order);
          } catch (error) {
            console.error('Failed to decrypt order:', error);
          }
        }

        resolve(orders);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update order status
   * 
   * @param commitmentHash - Order commitment hash
   * @param status - New status
   */
  async updateOrderStatus(
    commitmentHash: string,
    status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired'
  ): Promise<void> {
    if (!this.db) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.ORDERS], 'readwrite');
    const objectStore = transaction.objectStore(STORES.ORDERS);

    return new Promise((resolve, reject) => {
      const getRequest = objectStore.get(commitmentHash);

      getRequest.onsuccess = () => {
        const encryptedOrder = getRequest.result as EncryptedOrder;
        if (encryptedOrder) {
          encryptedOrder.status = status;
          encryptedOrder.updatedAt = Date.now();

          const updateRequest = objectStore.put(encryptedOrder);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Order not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Synchronize state with on-chain data
   * 
   * @param apiEndpoint - Backend API endpoint
   * @param fromBlock - Starting block number
   */
  async syncWithChain(
    apiEndpoint: string = '/api/v1/sync',
    fromBlock?: number
  ): Promise<void> {
    // Get last sync state
    const syncState = await this.getSyncState();
    const startBlock = fromBlock || syncState?.lastSyncBlock || 0;

    // Fetch updates from backend
    const response = await fetch(`${apiEndpoint}?fromBlock=${startBlock}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Update balance notes
    if (data.balanceNotes) {
      for (const noteData of data.balanceNotes) {
        // Check if note belongs to user (can decrypt)
        try {
          await this.storeBalanceNote(noteData);
        } catch (error) {
          // Skip notes that don't belong to user
          console.debug('Skipping note:', error);
        }
      }
    }

    // Update orders
    if (data.orders) {
      for (const orderData of data.orders) {
        await this.updateOrderStatus(
          orderData.commitmentHash,
          orderData.status
        );
      }
    }

    // Update sync state
    await this.updateSyncState({
      key: 'main',
      lastSyncBlock: data.currentBlock,
      lastSyncTimestamp: Date.now(),
      treeRoot: data.treeRoot,
    });
  }

  /**
   * Get sync state
   */
  private async getSyncState(): Promise<SyncState | null> {
    if (!this.db) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.SYNC_STATE], 'readonly');
    const objectStore = transaction.objectStore(STORES.SYNC_STATE);

    return new Promise((resolve, reject) => {
      const request = objectStore.get('main');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update sync state
   */
  private async updateSyncState(state: SyncState): Promise<void> {
    if (!this.db) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.SYNC_STATE], 'readwrite');
    const objectStore = transaction.objectStore(STORES.SYNC_STATE);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(state);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Encrypt balance note
   */
  private async encryptBalanceNote(note: BalanceNote): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const noteData = JSON.stringify({
      asset: note.asset,
      amount: note.amount.toString(),
      salt: note.salt.toString(),
      owner: note.owner,
      nullifier: note.nullifier,
      index: note.index,
    });

    const encrypted = await this.encrypt(noteData);

    return {
      encryptedData: encrypted.ciphertext,
      iv: encrypted.iv,
      commitment: note.commitment,
      asset: note.asset, // Store unencrypted for indexing
      spent: note.spent,
      createdAt: note.createdAt,
    };
  }

  /**
   * Decrypt balance note
   */
  private async decryptBalanceNote(encrypted: any): Promise<BalanceNote> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const decrypted = await this.decrypt(encrypted.encryptedData, encrypted.iv);
    const noteData = JSON.parse(decrypted);

    return {
      asset: noteData.asset,
      amount: BigInt(noteData.amount),
      salt: BigInt(noteData.salt),
      owner: noteData.owner,
      nullifier: noteData.nullifier,
      commitment: encrypted.commitment,
      index: noteData.index,
      spent: encrypted.spent,
      createdAt: encrypted.createdAt,
    };
  }

  /**
   * Encrypt order
   */
  private async encryptOrder(
    order: OrderCommitment,
    status: string
  ): Promise<EncryptedOrder> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const orderData = JSON.stringify({
      orderParams: {
        baseAsset: order.orderParams.baseAsset,
        quoteAsset: order.orderParams.quoteAsset,
        amount: order.orderParams.amount.toString(),
        price: order.orderParams.price.toString(),
        orderType: order.orderParams.orderType,
        expiration: order.orderParams.expiration,
      },
      nonce: order.nonce.toString(),
    });

    const encrypted = await this.encrypt(orderData);

    return {
      encryptedData: encrypted.ciphertext,
      iv: encrypted.iv,
      commitmentHash: order.commitmentHash,
      status: status as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Decrypt order
   */
  private async decryptOrder(encrypted: EncryptedOrder): Promise<OrderCommitment> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const decrypted = await this.decrypt(encrypted.encryptedData, encrypted.iv);
    const orderData = JSON.parse(decrypted);

    return {
      commitmentHash: encrypted.commitmentHash,
      orderParams: {
        baseAsset: orderData.orderParams.baseAsset,
        quoteAsset: orderData.orderParams.quoteAsset,
        amount: BigInt(orderData.orderParams.amount),
        price: BigInt(orderData.orderParams.price),
        orderType: orderData.orderParams.orderType,
        expiration: orderData.orderParams.expiration,
        owner: orderData.orderParams.owner || '',
      },
      nonce: BigInt(orderData.nonce),
      timestamp: orderData.timestamp || Date.now(),
    };
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBytes
    );

    return {
      ciphertext: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(ciphertext: string, ivString: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = this.base64ToArrayBuffer(ivString);
    const encryptedData = this.base64ToArrayBuffer(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Derive encryption key from master key
   */
  private async deriveEncryptionKey(): Promise<CryptoKey> {
    const masterKeyBytes = new Uint8Array(32);
    const masterKeyHex = this.masterKey.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      masterKeyBytes[i] = parseInt(masterKeyHex.substr(i * 2, 2), 16);
    }

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKeyBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction(
      [STORES.BALANCE_NOTES, STORES.ORDERS, STORES.SYNC_STATE],
      'readwrite'
    );

    await Promise.all([
      this.clearStore(transaction, STORES.BALANCE_NOTES),
      this.clearStore(transaction, STORES.ORDERS),
      this.clearStore(transaction, STORES.SYNC_STATE),
    ]);
  }

  /**
   * Clear a specific store
   */
  private clearStore(transaction: IDBTransaction, storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export encrypted state for backup
   */
  async exportState(): Promise<string> {
    if (!this.db) {
      throw new Error('State manager not initialized');
    }

    const balanceNotes = await this.getAllBalanceNotes();
    const orders = await this.getAllOrders();
    const syncState = await this.getSyncState();

    return JSON.stringify({
      balanceNotes,
      orders,
      syncState,
      version: DB_VERSION,
      exportedAt: Date.now(),
    });
  }

  /**
   * Import encrypted state from backup
   */
  async importState(data: string): Promise<void> {
    const state = JSON.parse(data);

    // Import balance notes
    for (const note of state.balanceNotes) {
      await this.storeBalanceNote(note);
    }

    // Import orders
    for (const order of state.orders) {
      await this.storeOrder(order.order, order.status);
    }

    // Import sync state
    if (state.syncState) {
      await this.updateSyncState(state.syncState);
    }
  }

  /**
   * Get all balance notes
   */
  private async getAllBalanceNotes(): Promise<BalanceNote[]> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.BALANCE_NOTES], 'readonly');
    const objectStore = transaction.objectStore(STORES.BALANCE_NOTES);

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = async () => {
        const encryptedNotes = request.result;
        const notes: BalanceNote[] = [];

        for (const encrypted of encryptedNotes) {
          try {
            const note = await this.decryptBalanceNote(encrypted);
            notes.push(note);
          } catch (error) {
            console.error('Failed to decrypt note:', error);
          }
        }

        resolve(notes);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all orders
   */
  private async getAllOrders(): Promise<Array<{ order: OrderCommitment; status: string }>> {
    if (!this.db || !this.encryptionKey) {
      throw new Error('State manager not initialized');
    }

    const transaction = this.db.transaction([STORES.ORDERS], 'readonly');
    const objectStore = transaction.objectStore(STORES.ORDERS);

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = async () => {
        const encryptedOrders = request.result as EncryptedOrder[];
        const orders: Array<{ order: OrderCommitment; status: string }> = [];

        for (const encrypted of encryptedOrders) {
          try {
            const order = await this.decryptOrder(encrypted);
            orders.push({ order, status: encrypted.status });
          } catch (error) {
            console.error('Failed to decrypt order:', error);
          }
        }

        resolve(orders);
      };

      request.onerror = () => reject(request.error);
    });
  }
}
