/**
 * Audit & Compliance API Routes
 * 
 * Handles viewing key registration, revocation, and audit log queries
 * Requirements: 6.1, 6.2, 6.3
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

// In-memory storage for viewing keys (in production, use database)
interface ViewingKeyRecord {
  keyId: string;
  owner: string;
  dataScope: string;
  expiration: number;
  revoked: boolean;
  createdAt: number;
  accessLog: AccessLogEntry[];
}

interface AccessLogEntry {
  timestamp: number;
  accessor: string;
  action: string;
  dataAccessed: string;
}

const viewingKeys = new Map<string, ViewingKeyRecord>();
const auditLogs = new Map<string, AccessLogEntry[]>();

/**
 * POST /api/v1/audit/viewing-keys
 * Register a new viewing key
 */
router.post('/viewing-keys', async (req: Request, res: Response) => {
  try {
    const { keyId, owner, dataScope, expiration } = req.body;

    if (!keyId || !owner || !dataScope || !expiration) {
      return res.status(400).json({
        error: 'Missing required fields: keyId, owner, dataScope, expiration',
      });
    }

    // Check if key already exists
    if (viewingKeys.has(keyId)) {
      return res.status(409).json({
        error: 'Viewing key already exists',
      });
    }

    // Create viewing key record
    const record: ViewingKeyRecord = {
      keyId,
      owner,
      dataScope,
      expiration,
      revoked: false,
      createdAt: Date.now(),
      accessLog: [],
    };

    viewingKeys.set(keyId, record);

    // Initialize audit log for this key
    auditLogs.set(keyId, []);

    res.status(201).json({
      success: true,
      keyId,
      message: 'Viewing key registered successfully',
    });
  } catch (error) {
    console.error('Error registering viewing key:', error);
    res.status(500).json({
      error: 'Failed to register viewing key',
    });
  }
});

/**
 * POST /api/v1/audit/viewing-keys/:keyId/revoke
 * Revoke a viewing key
 */
router.post('/viewing-keys/:keyId/revoke', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    const record = viewingKeys.get(keyId);
    if (!record) {
      return res.status(404).json({
        error: 'Viewing key not found',
      });
    }

    // Mark as revoked
    record.revoked = true;
    viewingKeys.set(keyId, record);

    // Log revocation
    const logEntry: AccessLogEntry = {
      timestamp: Date.now(),
      accessor: record.owner,
      action: 'revoke',
      dataAccessed: 'viewing_key',
    };
    auditLogs.get(keyId)?.push(logEntry);

    res.json({
      success: true,
      message: 'Viewing key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking viewing key:', error);
    res.status(500).json({
      error: 'Failed to revoke viewing key',
    });
  }
});

/**
 * GET /api/v1/audit/viewing-keys/:keyId
 * Get viewing key details
 */
router.get('/viewing-keys/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    const record = viewingKeys.get(keyId);
    if (!record) {
      return res.status(404).json({
        error: 'Viewing key not found',
      });
    }

    res.json({
      keyId: record.keyId,
      owner: record.owner,
      dataScope: record.dataScope,
      expiration: record.expiration,
      revoked: record.revoked,
      createdAt: record.createdAt,
      isValid: !record.revoked && Date.now() < record.expiration,
    });
  } catch (error) {
    console.error('Error fetching viewing key:', error);
    res.status(500).json({
      error: 'Failed to fetch viewing key',
    });
  }
});

/**
 * GET /api/v1/audit/viewing-keys
 * Get all viewing keys for an owner
 */
router.get('/viewing-keys', async (req: Request, res: Response) => {
  try {
    const { owner } = req.query;

    if (!owner) {
      return res.status(400).json({
        error: 'Missing required query parameter: owner',
      });
    }

    const ownerKeys = Array.from(viewingKeys.values())
      .filter(record => record.owner === owner)
      .map(record => ({
        keyId: record.keyId,
        dataScope: record.dataScope,
        expiration: record.expiration,
        revoked: record.revoked,
        createdAt: record.createdAt,
        isValid: !record.revoked && Date.now() < record.expiration,
        accessCount: record.accessLog.length,
      }));

    res.json({
      keys: ownerKeys,
      total: ownerKeys.length,
    });
  } catch (error) {
    console.error('Error fetching viewing keys:', error);
    res.status(500).json({
      error: 'Failed to fetch viewing keys',
    });
  }
});

/**
 * GET /api/v1/audit/logs/:keyId
 * Get audit logs for a viewing key
 */
router.get('/logs/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    const logs = auditLogs.get(keyId);
    if (!logs) {
      return res.status(404).json({
        error: 'No audit logs found for this viewing key',
      });
    }

    res.json({
      keyId,
      logs: logs.map(log => ({
        timestamp: log.timestamp,
        accessor: log.accessor,
        action: log.action,
        dataAccessed: log.dataAccessed,
        formattedTime: new Date(log.timestamp).toISOString(),
      })),
      total: logs.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * POST /api/v1/audit/access
 * Log data access using viewing key
 */
router.post('/access', async (req: Request, res: Response) => {
  try {
    const { keyId, accessor, dataAccessed } = req.body;

    if (!keyId || !accessor || !dataAccessed) {
      return res.status(400).json({
        error: 'Missing required fields: keyId, accessor, dataAccessed',
      });
    }

    const record = viewingKeys.get(keyId);
    if (!record) {
      return res.status(404).json({
        error: 'Viewing key not found',
      });
    }

    // Check if key is valid
    if (record.revoked) {
      return res.status(403).json({
        error: 'Viewing key has been revoked',
      });
    }

    if (Date.now() > record.expiration) {
      return res.status(403).json({
        error: 'Viewing key has expired',
      });
    }

    // Log the access
    const logEntry: AccessLogEntry = {
      timestamp: Date.now(),
      accessor,
      action: 'access',
      dataAccessed,
    };

    record.accessLog.push(logEntry);
    auditLogs.get(keyId)?.push(logEntry);

    res.json({
      success: true,
      message: 'Access logged successfully',
    });
  } catch (error) {
    console.error('Error logging access:', error);
    res.status(500).json({
      error: 'Failed to log access',
    });
  }
});

/**
 * GET /api/v1/audit/solvency
 * Get system solvency proofs
 */
router.get('/solvency', async (req: Request, res: Response) => {
  try {
    // Mock solvency data (in production, calculate from on-chain data)
    const solvencyProofs = [
      {
        id: 'proof-2024-001',
        timestamp: Date.now() - 7200000, // 2 hours ago
        totalDeposits: '1245680000000000000000000', // 1,245,680 tokens
        totalCommitments: '1245680000000000000000000',
        verified: true,
        participants: 342,
        blockNumber: 12345678,
      },
      {
        id: 'proof-2024-002',
        timestamp: Date.now() - 93600000, // 1 day ago
        totalDeposits: '1238450000000000000000000',
        totalCommitments: '1238450000000000000000000',
        verified: true,
        participants: 340,
        blockNumber: 12340000,
      },
    ];

    res.json({
      proofs: solvencyProofs,
      total: solvencyProofs.length,
    });
  } catch (error) {
    console.error('Error fetching solvency proofs:', error);
    res.status(500).json({
      error: 'Failed to fetch solvency proofs',
    });
  }
});

export default router;
