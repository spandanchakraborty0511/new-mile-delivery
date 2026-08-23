const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
// NOTE: as later modules are built, mount them the same way, e.g.:
const zoneRoutes = require('./routes/zoneRoutes');
const rateCardRoutes = require('./routes/rateCardRoutes');
const orderRoutes = require('./routes/orderRoutes');
const agentRoutes = require('./routes/agentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/rate-cards', rateCardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
