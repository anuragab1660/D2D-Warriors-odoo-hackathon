require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/warehouses',  require('./routes/warehouses'));
app.use('/api/locations',   require('./routes/locations'));
app.use('/api/receipts',    require('./routes/receipts'));
app.use('/api/deliveries',  require('./routes/deliveries'));
app.use('/api/transfers',   require('./routes/transfers'));
app.use('/api/adjustments', require('./routes/adjustments'));
app.use('/api/move-history',require('./routes/moveHistory'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CoreInventory API running on port ${PORT}`);
});
