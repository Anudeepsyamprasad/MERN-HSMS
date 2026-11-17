const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { demoGuard, isDemoMode } = require('./middleware/demoGuard');

// Load environment variables from backend/config.env when running locally
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './config.env' });
}

const isProduction = process.env.NODE_ENV === 'production';
const app = express();

// Trust proxy - needed for rate limiting behind Render/Vercel proxies
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS: allowed frontend URLs come from CLIENT_URL (comma-separated), so
// moving the frontend to another host only needs an env var change.
const allowedOrigins = (process.env.CLIENT_URL ||
  (isProduction
    ? 'https://asp-hospital-management-system.onrender.com'
    : 'http://localhost:3000,http://127.0.0.1:3000'))
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check. Answers even while the database is still connecting, so the
// frontend can use it to wake up a sleeping free-tier server.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    demoMode: isDemoMode(),
  });
});

// If the database is unavailable, fail fast with a clear message.
// (The MongoDB driver reconnects on its own; no manual retry loop needed.)
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is starting up. Please retry in a few seconds.' });
  }
  next();
});

// Protect the public demo data (only active when DEMO_MODE=true)
app.use(demoGuard);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medical-records', require('./routes/medical-records'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler: log details on the server, never send internals to the client
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error('Missing MONGODB_URI or JWT_SECRET. See backend/.env.example');
    process.exit(1);
  }

  mongoose.set('strictQuery', false);
  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected (driver will reconnect)'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // IPv4 only, avoids slow IPv6 lookups on some hosts
    });
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (demo mode: ${isDemoMode()})`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Only start the server when run directly (lets tests import the app)
if (require.main === module) {
  startServer();
}

module.exports = app;
