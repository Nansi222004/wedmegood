const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

const userRoutes = require('./modules/user');
const vendorRoutes = require('./modules/vendor');
const adminRoutes = require('./modules/admin');
const uploadRoutes = require('./modules/upload/upload.routes');
const initializeAdmin = require('./utils/adminInit');

// Build list of base allowed origins
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://192.168.1.28:5173',
  'https://wedmegood-six.vercel.app',
  'https://uc-wed.vercel.app',
  'https://utsavo-wine.vercel.app',
  'https://wed-me-good-lake.vercel.app',
  'https://wedme-good1.vercel.app'
];

const envOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  .concat(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (mobile apps, Postman, curl, server-to-server)
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel domains (*.vercel.app)
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  // Allow any localhost / local IP port
  if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS Error: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error(`The CORS policy for this site does not allow access from the specified Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204
};

// Create Express app
const app = express();
const httpServer = http.createServer(app);

// Apply CORS middleware before any routes or handlers
app.use(cors(corsOptions));

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: corsOptions
});

// Socket.io connection handling & authentication
const { initSocketService } = require('./modules/chat/socket.service');
initSocketService(io);

// Make io accessible in requests
app.set('io', io);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/utsavo-chakra');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Run safe chat migration
    const { migrateConversations } = require('./modules/chat/chat.migration');
    await migrateConversations();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development ease
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    db_state: mongoose.connection.readyState
  });
});

// Seed trigger for production (TEMPORARY - PLEASE DELETE AFTER USE)
const Category = require('./modules/admin/Category');
app.get('/api/seed-categories-secure-xyz', async (req, res) => {
    try {
        const categories = [
            { name: 'Venues', description: 'Banquets, Farmhouses, and Hotels', slug: 'venues' },
            { name: 'Photographers', description: 'Wedding photography and videography', slug: 'photographers' },
            { name: 'Makeup Artists', description: 'Bridal makeup and hair styling', slug: 'makeup-artists' },
            { name: 'Decorators', description: 'Event decor and floral arrangements', slug: 'decorators' },
            { name: 'Catering', description: 'Food and beverage services', slug: 'catering' }
        ];
        await Category.deleteMany({});
        await Category.insertMany(categories);
        res.json({ success: true, message: "Categories seeded successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Maintenance mode middleware (allows /health and /api/admin/*)
const { maintenanceMiddleware } = require('./middleware/maintenance.middleware');
app.use(maintenanceMiddleware);

// API routes
const publicVendorRoutes = require('./modules/vendor/publicVendor.routes');
const publicRoutes = require('./modules/user/public.routes');
const { getAllCategories } = require('./modules/admin/adminController');

app.use('/api/public', publicRoutes);
app.use('/api/vendors', publicVendorRoutes);
app.get('/api/categories', getAllCategories);
app.use('/api/user', userRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/upload', uploadRoutes);

// Chat & Real-Time Messaging Routes
const { userRouter: chatUserRouter, vendorRouter: chatVendorRouter, uploadRouter: chatUploadRouter } = require('./modules/chat/chat.routes');
app.use('/api/user/conversations', chatUserRouter);
app.use('/api/vendor/conversations', chatVendorRouter);
app.use('/api/chat', chatUploadRouter);

app.get('/api/admin/test', (req, res) => res.json({ success: true, message: 'Test route works' }));
app.use('/api/admin', adminRoutes);

// Fallback for requests without /api prefix
app.use('/user', userRoutes);
app.use('/vendor', vendorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initializeAdmin();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`� Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
    console.log(`�📱 API URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
