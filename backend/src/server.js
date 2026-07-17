const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-blogging';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log('Connected to MongoDB');
  initializeRoles();
}).catch(err => {
  console.warn('MongoDB connection warning:', err.message);
  console.log('Server will continue without database');
});

async function initializeRoles() {
  try {
    const Role = require('./models/Role');
    if (Role && Role.seedDefaultRoles) {
      await Role.seedDefaultRoles();
      console.log('Default roles initialized');
    }
  } catch (error) {
    console.warn('Warning initializing roles:', error.message);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Load core routes with error handling
try { app.use('/api/auth', require('./routes/auth')); } catch (e) { console.warn('Auth route error:', e.message); }
try { app.use('/api/users', require('./routes/users')); } catch (e) { console.warn('Users route error:', e.message); }
try { app.use('/api/clients', require('./routes/clients')); } catch (e) { console.warn('Clients route error:', e.message); }
try { app.use('/api/blogs', require('./routes/blogs')); } catch (e) { console.warn('Blogs route error:', e.message); }
try { app.use('/api/workflow', require('./routes/workflow')); } catch (e) { console.warn('Workflow route error:', e.message); }
try { app.use('/api/roles', require('./routes/roles')); } catch (e) { console.warn('Roles route error:', e.message); }
try { app.use('/api/audit', require('./routes/audit')); } catch (e) { console.warn('Audit route error:', e.message); }

// Load feature routes if they exist
try { app.use('/api/translation', require('./routes/translation')); } catch (e) {}
try { app.use('/api/social-media', require('./routes/socialMedia')); } catch (e) {}
try { app.use('/api/email-notifications', require('./routes/emailNotifications')); } catch (e) {}
try { app.use('/api/rate-limit', require('./routes/rateLimit')); } catch (e) {}
try { app.use('/api/cache', require('./routes/cache')); } catch (e) {}
try { app.use('/api/custom-domain', require('./routes/customDomain')); } catch (e) {}
try { app.use('/api/subscription', require('./routes/subscription')); } catch (e) {}

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
