import { WebSocket } from 'ws';
import { wss } from '../index';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * Broadcast message to all connected WebSocket clients
 */
export function broadcast(message: WebSocketMessage) {
  const data = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

/**
 * Broadcast order update
 */
export function broadcastOrderUpdate(data: any) {
  broadcast({
    type: 'order_update',
    ...data
  });
}

/**
 * Broadcast settlement event
 */
export function broadcastSettlement(data: any) {
  broadcast({
    type: 'settlement',
    ...data
  });
}

/**
 * Broadcast tree root update
 */
export function broadcastTreeUpdate(data: any) {
  broadcast({
    type: 'tree_update',
    ...data
  });
}
