import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { json } from 'body-parser';
import { config } from './config/config';
import walletRoutes from './routes/walletRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(json({ limit: '1mb' })); // Parse JSON requests

// Apply rate limiting
app.use(rateLimit(config.rateLimit));

// Routes
app.use('/api/wallet', walletRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
