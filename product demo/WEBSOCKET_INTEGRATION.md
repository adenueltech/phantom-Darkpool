# WebSocket Real-Time Updates Integration

## Overview

Task 12.5 has been completed, implementing real-time order book updates via WebSocket connections between the frontend and backend.

## Implementation Details

### Frontend Changes

#### 1. Trading Page (`product demo/app/trading/page.tsx`)
- Integrated `useWebSocket` hook for real-time event handling
- Added WebSocket connection status indicator
- Implemented event handlers for:
  - `order_submitted`: New orders added to order book
  - `order_matched`: Orders matched by matching engine
  - `order_cancelled`: Orders cancelled by users
  - `settlement_complete`: Trade settlements completed
  - `tree_root_updated`: Commitment tree updates
- Real-time order status updates in active orders table
- Live indicator showing WebSocket connection status

#### 2. WebSocket Hook (`product demo/hooks/use-websocket.ts`)
Already implemented with:
- Automatic connection management
- Event subscription system
- Connection status tracking
- Auto-reconnect on disconnect

#### 3. WebSocket Client (`product demo/lib/websocket-client.ts`)
Enhanced with:
- Corrected WebSocket URL to match backend port
- Automatic reconnection with exponential backoff
- Event type safety with TypeScript
- Connection state management

### Backend Changes

#### 1. Server Setup (`packages/backend/src/index.ts`)
- WebSocket server runs on same port as HTTP server (3000)
- Enhanced connection handling with welcome messages
- Better error handling for WebSocket connections
- Improved logging for debugging

#### 2. Order Service (`packages/backend/src/services/orderService.ts`)
Already implements:
- `broadcastOrderUpdate()` when orders are submitted
- WebSocket event broadcasting for order lifecycle
- Integration with WebSocket service

#### 3. WebSocket Service (`packages/backend/src/services/websocketService.ts`)
Already implements:
- `broadcast()`: Send messages to all connected clients
- `broadcastOrderUpdate()`: Order-specific updates
- `broadcastSettlement()`: Settlement events
- `broadcastTreeUpdate()`: Tree root updates

## WebSocket Event Types

### 1. Order Submitted
```typescript
{
  type: 'order_submitted',
  data: {
    orderId: string,
    timestamp: number
  }
}
```
Triggered when: New order is submitted to Order Registry

### 2. Order Matched
```typescript
{
  type: 'order_matched',
  data: {
    orderId: string,
    executionId: string
  }
}
```
Triggered when: Matching engine finds compatible orders

### 3. Order Cancelled
```typescript
{
  type: 'order_cancelled',
  data: {
    orderId: string
  }
}
```
Triggered when: User cancels an active order

### 4. Settlement Complete
```typescript
{
  type: 'settlement_complete',
  data: {
    executionId: string,
    orderIds: string[]
  }
}
```
Triggered when: Trade settlement is confirmed on-chain

### 5. Tree Root Updated
```typescript
{
  type: 'tree_root_updated',
  data: {
    newRoot: string,
    leafCount: number
  }
}
```
Triggered when: Commitment tree root changes (new deposits/settlements)

## User Experience

### Connection Indicator
- **Green "Live"**: WebSocket connected, receiving real-time updates
- **Gray "Offline"**: WebSocket disconnected, showing cached data

### Real-Time Features
1. **Order Book Updates**: Live order additions/removals
2. **Order Status Changes**: Instant status updates (Active → Matched → Settled)
3. **Settlement Notifications**: Toast notifications for completed trades
4. **Live Indicator**: Pulsing green dot on order book when connected

### Automatic Reconnection
- Reconnects automatically if connection drops
- Exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum 5 reconnection attempts
- User sees "Offline" status during reconnection

## Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  Frontend       │                             │  Backend        │
│  (Trading Page) │                             │  (Express +     │
│                 │                             │   WebSocket)    │
└─────────────────┘                             └─────────────────┘
        │                                               │
        │ useWebSocket hook                             │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│ WebSocket       │                             │ WebSocket       │
│ Client          │                             │ Service         │
│ - Auto-connect  │                             │ - Broadcast     │
│ - Reconnect     │                             │ - Event types   │
│ - Event handler │                             │ - Client mgmt   │
└─────────────────┘                             └─────────────────┘
```

## Testing

### Manual Testing

1. **Start Backend**
   ```bash
   cd packages/backend
   npm run dev
   ```
   Verify: "WebSocket server ready on ws://localhost:3000"

2. **Start Frontend**
   ```bash
   cd product\ demo
   npm run dev
   ```

3. **Test Connection**
   - Navigate to /trading
   - Check for green "Live" indicator in top right
   - Open browser console
   - Look for "WebSocket connected" message

4. **Test Order Submission**
   - Place a new order
   - Verify toast notification appears
   - Check order appears in "Your Active Orders" table
   - Verify WebSocket event in console

5. **Test Reconnection**
   - Stop backend server
   - Verify "Offline" indicator appears
   - Restart backend server
   - Verify automatic reconnection
   - Check "Live" indicator returns

### Browser Console Testing

```javascript
// Check WebSocket connection
wsClient.isConnected()

// Manually trigger event (for testing)
wsClient.notifyListeners({
  type: 'order_matched',
  data: { orderId: 'test123', executionId: 'exec456' }
})
```

### Backend Testing

```bash
# Test WebSocket endpoint
wscat -c ws://localhost:3000

# Should receive welcome message:
# {"type":"connected","message":"Connected to Phantom Darkpool WebSocket"}
```

## Requirements Satisfied

### Requirement 15.6: Real-Time Updates
✅ WebSocket server provides real-time updates
✅ Order status updates broadcast to all clients
✅ Settlement events broadcast immediately
✅ Tree root updates broadcast on changes

## Integration Points

### Order Submission Flow
1. User submits order via trading page
2. Backend processes order
3. `broadcastOrderUpdate()` called
4. All connected clients receive update
5. Frontend updates order book display

### Settlement Flow
1. Matching engine settles trades
2. `broadcastSettlement()` called
3. All connected clients receive update
4. Frontend updates order statuses
5. Toast notification shown to users

### Tree Update Flow
1. New commitment added to tree
2. `broadcastTreeUpdate()` called
3. All connected clients receive update
4. Frontend can refresh Merkle proofs if needed

## Performance Considerations

### Connection Management
- Single WebSocket connection per client
- Automatic cleanup on page unload
- Reconnection with exponential backoff
- Maximum 5 reconnection attempts

### Message Broadcasting
- Efficient broadcast to all clients
- No message queuing (real-time only)
- Automatic cleanup of closed connections
- Error handling for failed sends

### Scalability
- Current implementation: Single server
- Production: Use Redis pub/sub for multi-server
- Consider WebSocket load balancer
- Implement message rate limiting

## Known Limitations (Demo Mode)

1. **Single Server**: No horizontal scaling support
2. **No Authentication**: All clients receive all events
3. **No Message History**: Only real-time events (no replay)
4. **No Filtering**: Clients receive all events (no subscriptions)

## Production Deployment Checklist

- [ ] Implement WebSocket authentication
- [ ] Add event filtering/subscriptions per user
- [ ] Implement Redis pub/sub for multi-server
- [ ] Add message rate limiting
- [ ] Implement message persistence/replay
- [ ] Add WebSocket load balancer
- [ ] Implement heartbeat/ping-pong
- [ ] Add connection metrics/monitoring
- [ ] Implement graceful shutdown
- [ ] Add SSL/TLS for wss://

## Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Backend (.env)
PORT=3000
```

## Troubleshooting

### WebSocket Won't Connect
1. Check backend is running on port 3000
2. Verify NEXT_PUBLIC_WS_URL is correct
3. Check browser console for errors
4. Verify firewall allows WebSocket connections

### Connection Drops Frequently
1. Check network stability
2. Verify server isn't restarting
3. Check for proxy/load balancer issues
4. Increase reconnection attempts

### Events Not Received
1. Verify WebSocket is connected (green indicator)
2. Check backend is broadcasting events
3. Verify event type matches expected format
4. Check browser console for errors

## Next Steps

1. **Task 12.6**: Connect dashboard to balance and transaction data
2. **Task 12.7**: Implement audit/compliance features in UI
3. **Checkpoint 13**: Verify end-to-end frontend integration

## Related Files

### Frontend
- `product demo/app/trading/page.tsx` - Trading page with WebSocket
- `product demo/hooks/use-websocket.ts` - WebSocket React hook
- `product demo/lib/websocket-client.ts` - WebSocket client

### Backend
- `packages/backend/src/index.ts` - WebSocket server setup
- `packages/backend/src/services/websocketService.ts` - Broadcasting
- `packages/backend/src/services/orderService.ts` - Order events
