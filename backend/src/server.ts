import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { swaggerOptions } from './config/swagger';

// Import routes
import countriesRoutes from './routes/countries';
import complianceRoutes from './routes/compliance';
import newsRoutes from './routes/news';
import exportRoutes from './routes/export';
import searchRoutes from './routes/search';
import customLinksRoutes from './routes/customLinks';
import customContentRoutes from './routes/customContent';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses when behind a reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// Swagger documentation
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Invoicing Compliance API',
}));

// Serve OpenAPI spec as JSON
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// API routes
app.use('/api/v1/countries', countriesRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/custom-links', customLinksRoutes);
app.use('/api/v1/custom-content', customContentRoutes);

// API root endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'E-Invoicing Compliance Tracker API',
      version: 'v1',
      description: 'RESTful API for tracking e-invoicing compliance requirements across countries',
      documentation: '/api/docs',
      endpoints: {
        countries: '/api/v1/countries',
        compliance: '/api/v1/compliance',
        news: '/api/v1/news',
        export: '/api/v1/export',
        search: '/api/v1/search',
        customLinks: '/api/v1/custom-links',
        customContent: '/api/v1/custom-content',
      },
    },
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;