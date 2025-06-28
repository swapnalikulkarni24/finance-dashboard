// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorMiddleware';
import User, { IUser } from '../models/User';

// Extend the Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
      };
    }
  }
}

// Protect routes
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // You could also check for a token in cookies if using httpOnly cookies, e.g.:
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new CustomError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Attach user to the request object (without the password)
    // We only need the user ID for subsequent operations or to populate user details
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error(error);
    return next(new CustomError('Not authorized, token failed', 401));
  }
};
