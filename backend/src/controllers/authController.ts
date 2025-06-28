// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { CustomError } from '../middleware/errorMiddleware'; // We'll create this next
import jwt from 'jsonwebtoken';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return next(new CustomError('User already exists with this email', 400));
    }

    user = await User.create({
      username,
      email,
      password,
    });

    // Generate token and send response
    sendTokenResponse(user, 201, res);

  } catch (error: any) {
    // Handle validation errors or other MongoDB errors
    if (error.code === 11000) { // Duplicate key error
      return next(new CustomError('Duplicate field value entered', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new CustomError(messages.join(', '), 400));
    }
    next(error); // Pass other errors to the general error handler
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new CustomError('Please provide an email and password', 400));
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user) {
      return next(new CustomError('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new CustomError('Invalid credentials', 401));
    }

    // Generate token and send response
    sendTokenResponse(user, 200, res);

  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user will be available from the protect middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new CustomError('User not found', 404));
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Helper function to send token in response
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  const token = user.generateAuthToken();

  // Options for cookie (if you choose to use httpOnly cookies)
  const options = {
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    httpOnly: true // Prevents client-side JS from accessing the cookie
  };

  // For simplicity and ease of frontend integration with JWT, we'll send it in JSON response.
  // For production, consider using httpOnly cookies for better security.
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};
