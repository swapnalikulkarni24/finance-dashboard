// backend/src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// Custom error class for specific HTTP errors
export class CustomError extends Error {
  statusCode: number;
  errors?: any; // Optional field for validation errors etc.

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// Global error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log to console for dev
  console.error(err.stack);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    error = new CustomError(messages.join(', '), 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    errors: error.errors || null // Include validation errors if available
  });
};

export default errorHandler;
