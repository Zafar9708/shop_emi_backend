// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');   // ✅ ADD THIS
const connectDB = require('./config/database');

dns.setDefaultResultOrder('ipv4first');  // ✅ ADD THIS




dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: '*', // for testing
}));

app.use(cors({
  origin: [
    "https://shop-emi-frontend-4of3.vercel.app"
  ],
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/emi', require('./routes/emiRoutes'));

// Home route
app.get('/', (req, res) => {
  res.json({
    name: 'Shop EMI Management System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      customers: '/api/customers',
      devices: '/api/devices',
      emi: '/api/emi'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.send("API working ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});