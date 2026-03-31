// 1. Imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Import your routes

// 2. Initialize the App (This MUST come before app.use)
const app = express();

// 3. Standard Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// 4. Routes (Now app is defined, so this will work)
app.use('/api/auth', authRoutes);

// 5. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("IDB Database Connected Successfully"))
  .catch((err) => console.log("DB Connection Error: ", err));

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});