const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const app = express();

// Trust proxy - needed for rate limiting behind proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware with retry logic
app.use(async (req, res, next) => {
  const connectionState = mongoose.connection.readyState;
  console.log(`Database connection state: ${connectionState}`);
  
  if (connectionState !== 1) {
    console.log(`Database not ready, state: ${connectionState}. Attempting to reconnect...`);
    
    try {
      // Try to reconnect if disconnected
      if (connectionState === 0) {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
          family: 4,
          bufferCommands: false,
          retryWrites: true,
          retryReads: true,
          connectTimeoutMS: 5000,
          heartbeatFrequencyMS: 10000,
          maxIdleTimeMS: 0
        });
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mongoose.connection.readyState === 1) {
          console.log('Database reconnected successfully');
          return next();
        }
      }
      
      return res.status(503).json({ 
        message: 'Database connection not ready. Please try again in a moment.',
        state: connectionState
      });
    } catch (error) {
      console.log('Failed to reconnect to database:', error.message);
      return res.status(503).json({ 
        message: 'Database connection failed. Please try again in a moment.',
        state: connectionState
      });
    }
  }
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Configure mongoose for better connection stability
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', false);
    
    const options = {
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      retryWrites: true, // Retry writes on network errors
      retryReads: true, // Retry reads on network errors
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      maxIdleTimeMS: 0 // Don't close connections due to inactivity
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Wait for connection to be ready
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB Connected and ready');
    console.log('Connection state after ping:', mongoose.connection.readyState);
    
    // Set up automatic reconnection
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
      setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI, options).catch(err => {
          console.log('Reconnection failed:', err.message);
        });
      }, 1000);
    });
    
  } catch (err) {
    console.log('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected to MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
});


const PORT = process.env.PORT || 5000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Routes - only load after database connection is established
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/patients', require('./routes/patients'));
    app.use('/api/doctors', require('./routes/doctors'));
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/medical-records', require('./routes/medical-records'));
    
    console.log('Routes loaded successfully');
    
    // Error handling middleware - must be after routes
    app.use((err, req, res, next) => {
      console.error('Error details:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    });

    // 404 handler - must be after routes
    app.use('*', (req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

