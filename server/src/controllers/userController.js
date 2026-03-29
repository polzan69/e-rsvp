const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, password, role } = req.body;

    // 🔎 Basic validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 🔐 Enforce password for admin/super_admin
    if (role !== 'invitee' && !password) {
      return res.status(400).json({ message: 'Password is required for this role' });
    }

    // 🔁 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 🔑 Hash password if present
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);

    // Handle duplicate index error (important)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// Login function for admin and super_admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check role (only admin and super_admin can login)
    if (user.role === 'invitee') {
      return res.status(403).json({ message: 'Invitees cannot login. Use OTP verification instead' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};