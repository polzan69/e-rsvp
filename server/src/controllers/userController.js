const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, password, role, paymentStatus, serviceType } = req.body;

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
      role,
      paymentStatus: role === 'admin' ? (paymentStatus || 'pending') : undefined,
      serviceType: role === 'admin' ? (serviceType || 'standard') : undefined,
    });

    await user.save();

    const responseUser = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    // Only include payment fields for admin
    if (role === 'admin') {
      responseUser.paymentStatus = user.paymentStatus;
      responseUser.serviceType = user.serviceType;
    }

    res.status(201).json({
      message: 'User created successfully',
      user: responseUser
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

// Get all users - Admins can view users, Super Admin can view all
exports.getAllUsers = async (req, res) => {
  try {
    const { role: userRole } = req.user;

    let query = {};

    // Admins cannot view other admins or super_admin data
    if (userRole === 'admin') {
      query.role = 'invitee'; // Admins can only view invitees
    }
    // Super admin can view everyone

    const users = await User.find(query).select('-password'); // Don't send passwords

    res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user - Super Admin can update anyone, Admins have limited access
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: requestingUserId, role: requestingUserRole } = req.user;
    const updateData = req.body;

    // Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Authorization checks
    if (requestingUserRole === 'admin') {
      // Admins can only edit invitees, not admins or super_admin
      if (targetUser.role !== 'invitee') {
        return res.status(403).json({ 
          message: 'Admins cannot edit other admin or super_admin accounts' 
        });
      }

      // Admins can only update certain fields for invitees
      const allowedFields = ['firstName', 'lastName', 'eventId'];
      const filteredData = {};
      allowedFields.forEach(field => {
        if (field in updateData) {
          filteredData[field] = updateData[field];
        }
      });

      Object.assign(targetUser, filteredData);
    } else if (requestingUserRole === 'super_admin') {
      // Super admin can update any field for anyone
      // But prevent updating certain critical fields via this endpoint
      const protectedFields = ['role', '_id', 'createdAt']; // require separate endpoints
      
      Object.keys(updateData).forEach(key => {
        if (!protectedFields.includes(key)) {
          targetUser[key] = updateData[key];
        }
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await targetUser.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: targetUser._id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        paymentStatus: targetUser.paymentStatus,
        serviceType: targetUser.serviceType,
        eventId: targetUser.eventId
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user - Only Super Admin can delete users
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: requestingUserRole } = req.user;

    // Only super_admin can delete users
    if (requestingUserRole !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Only super admin can delete users' 
      });
    }

    // Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super_admin from deleting other super_admin accounts
    if (user.role === 'super_admin') {
      // Re-insert the user (undo the deletion)
      await User.create(user.toObject());
      return res.status(403).json({ 
        message: 'Cannot delete other super admin accounts' 
      });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};