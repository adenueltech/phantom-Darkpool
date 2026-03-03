import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Provider } from 'starknet';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL || 'https://starknet-testnet.public.blastapi.io';

// Middleware
app.use(cors());
app.use(express.json());

// Starknet provider
export const starknetProvider = new Provider({ nodeUrl: STARKNET_RPC_URL });

// HTTP server
const server = createServer(app);

// WebSocket server for real-time updates
export const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'phantom-darkpool-backend',
    starknet: STARKNET_RPC_URL
  });
});

// API routes
import orderRoutes from './routes/orders';
import balanceRoutes from './routes/balance';
import treeRoutes from './routes/tree';

app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/balance', balanceRoutes);
app.use('/api/v1/commitment-tree', treeRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Starknet RPC: ${STARKNET_RPC_URL}`);
});

export default app;
