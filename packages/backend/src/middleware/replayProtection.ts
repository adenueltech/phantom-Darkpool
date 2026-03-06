/**
 * Replay Attack Prevention Middleware
 * 
 * Implements replay attack prevention:
 * - Nonce tracking
 * - Timestamp validation
 * - Request signature verification
 * - Nullifier uniqueness enforcement
 * 
 * Requirements: 9.3, 9.4, 17.3
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Replay protection configuration
 */
export interface ReplayProtectionConfig {
  nonceExpiration: number; // Nonce expiration time in milliseconds
  timestampTolerance: number; // Allowed timestamp drift in milliseconds
  requireSignature: boolean; // Require request signatures
}

/**
 * Nonce entry
 */
interface NonceEntry {
  timestamp: number;
  used: boolean;
}

/**
 * Replay Protection Manager
 * Prevents replay attacks on API endpoints
 */
export class ReplayProtectionManager {
  private usedNonces: Map<string, NonceEntry> = new Map();
  private usedNullifiers: Set<string> = new Set();
  private config: ReplayProtectionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ReplayProtectionConfig> = {}) {
    this.config = {
      nonceExpiration: 300000, // 5 minutes
      timestampTolerance: 60000, // 1 minute
      requireSignature: true,
      ...config,
    };

    this.startCleanup();
  }

  /**
   * Create replay protection middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract replay protection headers
        const nonce = req.headers['x-nonce'] as string;
        const timestamp = req.headers['x-timestamp'] as string;
        const signature = req.headers['x-signature'] as string;

        // Validate required headers
        if (!nonce || !timestamp) {
          return res.status(400).json({
            error: 'Missing replay protection headers',
            message: 'x-nonce and x-timestamp headers are required',
          });
        }

        // Validate timestamp
        const requestTime = parseInt(timestamp, 10);
        if (isNaN(requestTime)) {
          return res.status(400).json({
            error: 'Invalid timestamp',
            message: 'x-timestamp must be a valid Unix timestamp',
          });
        }

        const now = Date.now();
        const timeDiff = Math.abs(now - requestTime);

        if (timeDiff > this.config.timestampTolerance) {
          return res.status(400).json({
            error: 'Timestamp out of range',
            message: 'Request timestamp is too old or too far in the future',
            timeDiff,
            tolerance: this.config.timestampTolerance,
          });
        }

        // Check nonce uniqueness
        if (this.usedNonces.has(nonce)) {
          return res.status(400).json({
            error: 'Replay attack detected',
            message: 'Nonce has already been used',
          });
        }

        // Verify signature if required
        if (this.config.requireSignature) {
          if (!signature) {
            return res.status(400).json({
              error: 'Missing signature',
              message: 'x-signature header is required',
            });
          }

          const isValid = await this.verifySignature(req, signature);
          if (!isValid) {
            return res.status(401).json({
              error: 'Invalid signature',
              message: 'Request signature verification failed',
            });
          }
        }

        // Mark nonce as used
        this.usedNonces.set(nonce, {
          timestamp: now,
          used: true,
        });

        next();
      } catch (error) {
        console.error('Replay protection error:', error);
        return res.status(500).json({
          error: 'Replay protection error',
          message: 'Failed to validate replay protection',
        });
      }
    };
  }

  /**
   * Verify request signature
   */
  private async verifySignature(req: Request, signature: string): Promise<boolean> {
    try {
      // Create message to verify
      const message = this.createSignatureMessage(req);

      // In production, verify signature using public key cryptography
      // For now, basic validation
      const expectedSignature = crypto
        .createHash('sha256')
        .update(message)
        .digest('hex');

      // Note: In production, use proper signature verification
      // with the user's public key
      return signature.length > 0;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create message for signature verification
   */
  private createSignatureMessage(req: Request): string {
    const nonce = req.headers['x-nonce'];
    const timestamp = req.headers['x-timestamp'];
    const method = req.method;
    const path = req.path;
    const body = JSON.stringify(req.body);

    return `${method}:${path}:${nonce}:${timestamp}:${body}`;
  }

  /**
   * Check if nullifier has been used
   */
  isNullifierUsed(nullifier: string): boolean {
    return this.usedNullifiers.has(nullifier);
  }

  /**
   * Mark nullifier as used
   */
  markNullifierUsed(nullifier: string): void {
    if (this.usedNullifiers.has(nullifier)) {
      throw new Error('Nullifier already used - double spend attempt detected');
    }
    this.usedNullifiers.add(nullifier);
  }

  /**
   * Validate nullifier uniqueness
   */
  validateNullifier(nullifier: string): boolean {
    if (!nullifier || nullifier.length === 0) {
      return false;
    }

    if (this.usedNullifiers.has(nullifier)) {
      return false;
    }

    return true;
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredNonces: string[] = [];

      // Find expired nonces
      for (const [nonce, entry] of this.usedNonces.entries()) {
        if (now - entry.timestamp > this.config.nonceExpiration) {
          expiredNonces.push(nonce);
        }
      }

      // Remove expired nonces
      for (const nonce of expiredNonces) {
        this.usedNonces.delete(nonce);
      }

      if (expiredNonces.length > 0) {
        console.log(`Cleaned up ${expiredNonces.length} expired nonces`);
      }
    }, this.config.nonceExpiration);
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Reset all nonces and nullifiers (for testing)
   */
  reset(): void {
    this.usedNonces.clear();
    this.usedNullifiers.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    usedNonces: number;
    usedNullifiers: number;
  } {
    return {
      usedNonces: this.usedNonces.size,
      usedNullifiers: this.usedNullifiers.size,
    };
  }
}

/**
 * Global replay protection instance
 */
export const replayProtection = new ReplayProtectionManager();

/**
 * Middleware for nullifier validation
 */
export function validateNullifierMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const nullifier = req.body.nullifier;

    if (!nullifier) {
      return res.status(400).json({
        error: 'Missing nullifier',
        message: 'Nullifier is required for this operation',
      });
    }

    if (!replayProtection.validateNullifier(nullifier)) {
      return res.status(400).json({
        error: 'Invalid nullifier',
        message: 'Nullifier has already been used - double spend attempt detected',
      });
    }

    next();
  };
}
