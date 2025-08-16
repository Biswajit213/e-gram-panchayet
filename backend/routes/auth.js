const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyIdToken, createUser, getUserRole } = require('../config/firebase-admin');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, address, password } = req.body;

    // Create user in Firebase
    const userRecord = await createUser({
      name,
      email,
      phone,
      address,
      password,
      role: 'user' // Default role for registration
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          uid: userRecord.uid,
          name,
          email: userRecord.email,
          role: 'user'
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    let message = 'Registration failed';
    if (error.code === 'auth/email-already-exists') {
      message = 'Email is already registered';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak';
    }

    res.status(400).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { idToken, role } = req.body;

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user role from database
    const userRole = await getUserRole(uid);

    // Check if user has the required role
    if (userRole !== role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid role for this user.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userRole
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: decodedToken.uid,
          name: decodedToken.name,
          email: decodedToken.email,
          role: userRole
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    let message = 'Login failed';
    if (error.message === 'Invalid token') {
      message = 'Invalid credentials';
    }

    res.status(401).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Generate new token
    const newToken = jwt.sign(
      { 
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
});

module.exports = router;
