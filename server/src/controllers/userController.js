const User = require('../models/User');
const bcrypt = require('bcryptjs');

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