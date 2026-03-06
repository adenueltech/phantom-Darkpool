/**
 * Balance Note Management
 * 
 * Manages encrypted balance notes in IndexedDB for client-side storage.
 * Provides functions to create, retrieve, and manage private balances.
 * 
 * Requirements: 14.1
 */

import { createBalanceNote, addressToBigInt, bigIntToAddress } from '../crypto/pedersen';
import { generateNullifier, deriveNullifierSecret } from '../crypto/nullifier';
import { poseidonHashMany } from '../crypto/poseidon';

/**
 * Balance note structure
 */
export interface BalanceNote {
  asset: string;
  amount: bigint;
  salt: bigint;
  owner: string;
  nullifier: string;
  commitment: string;
  index?: number; // Tree index
  spent: boolean;
  createdAt: number;
}

/**
 * Encrypted balance note for storage
 */
interface EncryptedBalanceNote {
  encryptedData: string;
  iv: string;
  commitment: string;
  spent: boolean;
  createdAt: number;
}

/**
 * Balance Note Manager
 * Handles creation, storage, and retrieval of balance notes
 */
export class BalanceNoteManager {
  private dbName: string = 'phantom-darkpool';
  private storeName: string = 'balance-notes';
  private db: IDBDatabase | null = null;
  private masterKey: bigint;

  constructor(masterKey: bigint) {
    this.masterKey = masterKey;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { 
            keyPath: 'commitment' 
          });
          objectStore.createIndex('spent', 'spent', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Create a new private balance note
   * 
   * @param asset - Asset address
   * @param amount - Balance amount
   * @param owner - Owner's address
   * @returns Created balance note
   */
  async createPrivateBalance(
    asset: string,
    amount: bigint,
    owner: string
  ): Promise<BalanceNote> {
    // Convert addresses to bigint for commitment
    const assetBigInt = addressToBigInt(asset);
    const ownerBigInt = addressToBigInt(owner);

    // Create balance note with commitment
    const noteData = createBalanceNote(assetBigInt, amount, ownerBigInt);

    // Derive nullifier secret from master key
    const noteIndex = BigInt(Date.now()); // Use timestamp as index
    const nullifierSecret = await deriveNullifierSecret(this.masterKey, noteIndex);

    // Generate nullifier
    const nullifier = await generateNullifier(noteData.commitment, nullifierSecret);

    // Create balance note
    const balanceNote: BalanceNote = {
      asset,
      amount,
      salt: noteData.salt,
      owner,
      nullifier: '0x' + nullifier.toString(16).padStart(64, '0'),
      commitment: '0x' + noteData.commitment.toString(16).padStart(64, '0'),
      spent: false,
      createdAt: Date.now(),
    };

    // Store encrypted note
    await this.storeNote(balanceNote);

    return balanceNote;
  }

  /**
   * Get balance for a specific asset
   * 
   * @param asset - Asset address
   * @returns Total unspent balance
   */
  async getBalance(asset: string): Promise<bigint> {
    const notes = await this.getAllNotes();
    
    let total = 0n;
    for (const note of notes) {
      if (note.asset === asset && !note.spent) {
        total += note.amount;
      }
    }

    return total;
  }

  /**
   * Get all unspent notes for an asset
   * 
   * @param asset - Asset address
   * @returns Array of unspent balance notes
   */
  async getUnspentNotes(asset: string): Promise<BalanceNote[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => note.asset === asset && !note.spent);
  }

  /**
   * Mark a note as spent
   * 
   * @param commitment - Note commitment to mark as spent
   */
  async markNoteSpent(commitment: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const getRequest = objectStore.get(commitment);

      getRequest.onsuccess = () => {
        const encryptedNote = getRequest.result as EncryptedBalanceNote;
        if (encryptedNote) {
          encryptedNote.spent = true;
          const updateRequest = objectStore.put(encryptedNote);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Note not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Store encrypted balance note in IndexedDB
   */
  private async storeNote(note: BalanceNote): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Encrypt note data
    const encrypted = await this.encryptNote(note);

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.add(encrypted);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all balance notes from storage
   */
  private async getAllNotes(): Promise<BalanceNote[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = async () => {
        const encryptedNotes = request.result as EncryptedBalanceNote[];
        const notes: BalanceNote[] = [];

        for (const encrypted of encryptedNotes) {
          try {
            const note = await this.decryptNote(encrypted);
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
   * Encrypt balance note for storage
   */
  private async encryptNote(note: BalanceNote): Promise<EncryptedBalanceNote> {
    const noteData = JSON.stringify({
      asset: note.asset,
      amount: note.amount.toString(),
      salt: note.salt.toString(),
      owner: note.owner,
      nullifier: note.nullifier,
      index: note.index,
    });

    // Use Web Crypto API for encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(noteData);

    // Derive encryption key from master key
    const keyMaterial = await this.deriveEncryptionKey();
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      data
    );

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv),
      commitment: note.commitment,
      spent: note.spent,
      createdAt: note.createdAt,
    };
  }

  /**
   * Decrypt balance note from storage
   */
  private async decryptNote(encrypted: EncryptedBalanceNote): Promise<BalanceNote> {
    // Derive encryption key from master key
    const keyMaterial = await this.deriveEncryptionKey();

    // Decrypt data
    const iv = this.base64ToArrayBuffer(encrypted.iv);
    const encryptedData = this.base64ToArrayBuffer(encrypted.encryptedData);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      encryptedData
    );

    const decoder = new TextDecoder();
    const noteData = JSON.parse(decoder.decode(decryptedData));

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
   * Derive encryption key from master key
   */
  private async deriveEncryptionKey(): Promise<CryptoKey> {
    // Convert master key to bytes
    const masterKeyBytes = new Uint8Array(32);
    const masterKeyHex = this.masterKey.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      masterKeyBytes[i] = parseInt(masterKeyHex.substr(i * 2, 2), 16);
    }

    // Import as raw key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKeyBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]), // Fixed salt for deterministic key
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
   * Clear all notes (for testing)
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
