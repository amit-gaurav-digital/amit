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
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  initializeRoles();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function initializeRoles() {
  try {
    const Role = require('./models/Role');
    await Role.seedDefaultRoles();
    console.log('Default roles initialized');
  } catch (error) {
    console.error('Error initializing roles:', error);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/audit', require('./routes/audit'));

if (require('./routes/topics')) {
  app.use('/api/topics', require('./routes/topics'));
}
if (require('./routes/research')) {
  app.use('/api/research', require('./routes/research'));
}
if (require('./routes/blogs')) {
  app.use('/api/blogs', require('./routes/blogs'));
}
if (require('./routes/approval')) {
  app.use('/api/approval', require('./routes/approval'));
}
if (require('./routes/publishing')) {
  app.use('/api/publishing', require('./routes/publishing'));
}
if (require('./routes/workflow')) {
  app.use('/api/workflow', require('./routes/workflow'));
}
if (require('./routes/scheduler')) {
  app.use('/api/scheduler', require('./routes/scheduler'));
}
if (require('./routes/advanced')) {
  app.use('/api/advanced', require('./routes/advanced'));
}

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
