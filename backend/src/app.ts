// backend/src/app.ts (Updated)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions'; // We'll create this later
import errorHandler from './middleware/errorMiddleware'; // Import the error handler

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); // Still to be implemented

// Custom Error Handler - MUST BE LAST MIDDLEWARE
app.use(errorHandler);

export default app;
