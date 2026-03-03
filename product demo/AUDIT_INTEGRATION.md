# Audit & Compliance Integration Guide

This document describes the audit and compliance features implemented in the Phantom Darkpool UI.

## Overview

The audit/compliance system allows users to:
- Generate viewing keys for selective data disclosure
- Share viewing keys with auditors
- Revoke viewing keys when needed
- View audit logs of data access
- Verify system solvency proofs

## Requirements Satisfied

- **Requirement 6.1**: Users can generate viewing keys for specific data access
- **Requirement 6.2**: Viewing keys are registered in the Audit Gateway
- **Requirement 6.3**: Viewing keys grant access only to authorized data scope

## Architecture

### Frontend Components

**Audit Page** (`app/audit/page.tsx`)
- Viewing key creation form
- Active viewing keys list
- Solvency proofs table
- Compliance features overview

**Hooks**
- `use-viewing-keys.ts`: Manages viewing key CRUD operations
- `use-solvency.ts`: Fetches and displays solvency proofs

### Backend API

**Audit Routes** (`packages/backend/src/routes/audit.ts`)

Endpoints:
- `POST /api/v1/audit/viewing-keys` - Register new viewing key
- `POST /api/v1/audit/viewing-keys/:keyId/revoke` - Revoke viewing key
- `GET /api/v1/audit/viewing-keys/:keyId` - Get viewing key details
- `GET /api/v1/audit/viewing-keys?owner=<address>` - Get all keys for owner
- `GET /api/v1/audit/logs/:keyId` - Get audit logs for key
- `POST /api/v1/audit/access` - Log data access
- `GET /api/v1/audit/solvency` - Get solvency proofs

### SDK Integration

**Viewing Key Manager** (`packages/sdk/src/wallet/viewingKeyManager.ts`)

Key features:
- Generate cryptographic viewing keys
- Derive decryption keys from master key
- Encrypt/decrypt data with viewing keys
- Manage key lifecycle (create, revoke, validate)

## Data Flow

### Creating a Viewing Key

1. User fills out form on audit page:
   - Data scope (Balance Notes, Orders, Trades, All)
   - Auditor/recipient name
   - Expiration period
   - Purpose

2. Frontend calls `createViewingKey()` hook:
   - Generates unique key ID using Poseidon hash
   - Derives decryption key from master key
   - Calculates expiration timestamp

3. Backend registers key:
   - Stores key metadata in database
   - Initializes audit log for key
   - Returns success confirmation

4. UI updates:
   - Adds key to viewing keys list
   - Shows success toast notification
   - Displays decryption key (hidden by default)

### Revoking a Viewing Key

1. User clicks "Revoke" button on active key

2. Frontend calls `revokeViewingKey()` hook:
   - Sends revocation request to backend
   - Updates local state

3. Backend processes revocation:
   - Marks key as revoked
   - Logs revocation in audit log
   - Returns success confirmation

4. UI updates:
   - Changes key status to "Revoked"
   - Removes revoke button
   - Shows revoked badge

### Viewing Audit Logs

1. User clicks on viewing key to expand details

2. Frontend calls `getAuditLogs()` hook:
   - Fetches access logs from backend
   - Formats timestamps

3. Backend returns logs:
   - Timestamp of each access
   - Accessor identity
   - Action performed
   - Data accessed

4. UI displays:
   - Chronological list of access events
   - Formatted timestamps
   - Access count badge

## Data Scopes

Viewing keys can grant access to different data scopes:

- **BALANCE_NOTE**: Access to encrypted balance notes
- **ORDER_COMMITMENT**: Access to order commitments
- **TRADE_HISTORY**: Access to trade execution history
- **ALL**: Access to all user data

## Security Features

### Key Generation
- Keys are generated using Poseidon hash for ZK-friendliness
- Decryption keys derived from user's master key
- Unique key IDs prevent collisions

### Access Control
- Keys are cryptographically bound to data scope
- Expired keys automatically become invalid
- Revoked keys cannot be reactivated
- All access is logged for audit trail

### Privacy Preservation
- Decryption keys are never sent to backend
- Only key metadata is stored on-chain
- Users share decryption keys off-chain with auditors
- Auditors can only decrypt authorized data

## Solvency Proofs

The system provides public solvency verification:

### Proof Structure
- Proof ID (unique identifier)
- Timestamp (when proof was generated)
- Total Deposits (sum of all deposits)
- Total Commitments (sum of all balance note commitments)
- Verification Status (verified/unverified)
- Participant Count (number of users)
- Block Number (on-chain reference)

### Verification
- Anyone can verify that total deposits = total commitments
- Proves system is solvent (no fractional reserve)
- Updated periodically (e.g., every 24 hours)
- Publicly accessible without authentication

## UI Features

### Viewing Key Creation Form
- Data scope selector
- Auditor name input
- Expiration period dropdown (7, 30, 90, 365 days)
- Purpose text input
- Generate button with loading state

### Viewing Keys List
- Key ID (truncated with ellipsis)
- Data scope badge
- Status badge (Active/Revoked/Expired)
- Creation timestamp
- Expiration countdown
- Show/hide decryption key toggle
- Copy to clipboard button
- Revoke button (for active keys)
- Access count indicator

### Solvency Proofs Table
- Proof ID
- Timestamp (relative format)
- Total deposits (formatted with $ and commas)
- Total commitments (formatted, highlighted in green)
- Verification status (checkmark icon)
- Participant count

### Compliance Features Cards
- Privacy-preserving audits explanation
- Selective disclosure explanation
- Visual icons and color coding

## Integration with Smart Contracts

### Audit Gateway Contract

The frontend integrates with the Audit Gateway contract for:

**Registration**:
```typescript
await contractClient.registerViewingKey(
  keyId,
  hashDataScope(dataScope),
  expiration
);
```

**Revocation**:
```typescript
await contractClient.revokeViewingKey(keyId);
```

**Validation**:
```typescript
const isValid = await contractClient.isKeyValid(keyId);
```

### Contract Addresses

Set in environment variables:
- `NEXT_PUBLIC_AUDIT_GATEWAY_ADDRESS` - Audit Gateway contract address

## Testing

### Manual Testing Checklist

- [ ] Connect wallet
- [ ] Create viewing key with different data scopes
- [ ] Verify key appears in list
- [ ] Show/hide decryption key
- [ ] Copy key to clipboard
- [ ] Revoke active key
- [ ] Verify revoked key cannot be revoked again
- [ ] Check solvency proofs load
- [ ] Verify timestamps format correctly
- [ ] Test without wallet connected (should show warning)

### Integration Testing

Test the full flow:
1. Create viewing key via UI
2. Verify key registered in backend
3. Simulate auditor access
4. Check audit log shows access
5. Revoke key
6. Verify access denied after revocation

## Future Enhancements

### Phase 2 Features
- [ ] Audit log viewer in UI
- [ ] Export viewing keys for backup
- [ ] Import viewing keys from backup
- [ ] Batch key creation
- [ ] Key templates for common use cases
- [ ] Email notifications for key access
- [ ] Advanced filtering and search
- [ ] Key usage analytics dashboard

### Phase 3 Features
- [ ] Multi-signature key revocation
- [ ] Time-locked keys (cannot revoke before expiration)
- [ ] Conditional access (e.g., only during business hours)
- [ ] Hierarchical keys (parent keys can revoke child keys)
- [ ] Integration with identity verification systems
- [ ] Automated compliance reporting

## Troubleshooting

### Common Issues

**Viewing keys not loading**
- Check wallet is connected
- Verify backend API is running
- Check browser console for errors
- Ensure API_URL environment variable is set

**Key creation fails**
- Verify wallet has sufficient balance for gas
- Check backend logs for errors
- Ensure all form fields are filled
- Try refreshing the page

**Solvency proofs not displaying**
- Check backend API is running
- Verify `/api/v1/audit/solvency` endpoint is accessible
- Check for CORS issues in browser console

## API Reference

### Create Viewing Key

```typescript
POST /api/v1/audit/viewing-keys
Content-Type: application/json

{
  "keyId": "0x1234...",
  "owner": "0xabcd...",
  "dataScope": "BALANCE_NOTE",
  "expiration": 1735689600000
}

Response:
{
  "success": true,
  "keyId": "0x1234...",
  "message": "Viewing key registered successfully"
}
```

### Revoke Viewing Key

```typescript
POST /api/v1/audit/viewing-keys/:keyId/revoke

Response:
{
  "success": true,
  "message": "Viewing key revoked successfully"
}
```

### Get Viewing Keys

```typescript
GET /api/v1/audit/viewing-keys?owner=0xabcd...

Response:
{
  "keys": [
    {
      "keyId": "0x1234...",
      "dataScope": "BALANCE_NOTE",
      "expiration": 1735689600000,
      "revoked": false,
      "createdAt": 1733097600000,
      "isValid": true,
      "accessCount": 3
    }
  ],
  "total": 1
}
```

### Get Audit Logs

```typescript
GET /api/v1/audit/logs/:keyId

Response:
{
  "keyId": "0x1234...",
  "logs": [
    {
      "timestamp": 1733097600000,
      "accessor": "0xauditor...",
      "action": "access",
      "dataAccessed": "balance_note_0x5678",
      "formattedTime": "2024-12-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Get Solvency Proofs

```typescript
GET /api/v1/audit/solvency

Response:
{
  "proofs": [
    {
      "id": "proof-2024-001",
      "timestamp": 1733097600000,
      "totalDeposits": "1245680000000000000000000",
      "totalCommitments": "1245680000000000000000000",
      "verified": true,
      "participants": 342,
      "blockNumber": 12345678
    }
  ],
  "total": 1
}
```

## Conclusion

The audit and compliance features provide institutional-grade selective disclosure capabilities while maintaining user privacy. Users have full control over what data they share, with whom, and for how long. All access is logged and auditable, meeting regulatory requirements without compromising the zero-knowledge privacy guarantees of the Phantom Darkpool system.
