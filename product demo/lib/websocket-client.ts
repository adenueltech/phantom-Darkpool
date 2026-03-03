/**
 * WebSocket Client for Real-Time Updates
 * Handles WebSocket connections to backend for live order book and settlement updates
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

export type WebSocketEvent = 
  | { type: 'order_submitted'; data: { orderId: string; timestamp: number } }
  | { type: 'order_cancelled'; data: { orderId: string } }
  | { type: 'order_matched'; data: { orderId: string; executionId: string } }
  | { type: 'settlement_complete'; data: { executionId: string; orderIds: string[] } }
  | { type: 'tree_root_updated'; data: { newRoot: string; leafCount: number } };

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<EventCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    
    // Auto-connect when first subscriber is added
    if (this.listeners.size === 1) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      
      // Disconnect when no more subscribers
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notifyListeners(event: WebSocketEvent) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in WebSocket event listener:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
