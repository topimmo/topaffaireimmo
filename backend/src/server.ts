import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import { redisStorage } from './utils/redisStorage.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting
app.use(apiLimiter);

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 CORS enabled for: ${config.corsOrigin}`);
    
    if (redisStorage.isAvailable()) {
      console.log('✅ Redis storage enabled for OTP');
    } else {
      console.log('⚠️  Using MongoDB for OTP storage (Redis not configured)');
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  await redisStorage.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  await redisStorage.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
