import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) {
        res.status(403);
        throw new Error('This account has been banned');
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      res.status(400);
      throw new Error('Name must be at least 2 characters');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email');
    }
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name + optional password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;

    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        res.status(400);
        throw new Error('Current password is required');
      }
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }
      if (req.body.newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
      }
      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    // If email service is not configured, return a clear message
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === 'your_gmail@gmail.com') {
      res.status(503);
      throw new Error('Email service is not configured yet. Please contact the administrator.');
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No account found with that email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"MovieVerse" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #141414; color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #E50914;">MovieVerse</h2>
          <h3>Password Reset Request</h3>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to reset it.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #E50914; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p style="color: #888; font-size: 13px;">This link will expire in 1 hour.</p>
          <p style="color: #888; font-size: 13px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export { authUser, registerUser, getProfile, updateProfile, forgotPassword, resetPassword };
