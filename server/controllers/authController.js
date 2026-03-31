const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email }).populate('role');
    
    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. SAFETY CHECK: Ensure the role was actually populated
    if (!user.role) {
      return res.status(500).json({ message: 'User role not found in database. Please re-run seed script.' });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role.name, permissions: user.role.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 4. Send Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax', // Added for better modern browser compatibility
      maxAge: 8 * 60 * 60 * 1000 
    });

    res.json({ 
      message: 'Login successful', 
      user: { 
        email: user.email, 
        role: user.role.name,
        firstName: user.firstName // Adding this so the frontend can greet the user
      } 
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error); // THIS IS KEY: Check your terminal for this!
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};